import { db } from "@/db";
import { conversations, conversationParticipants, messages, users, videos } from "@/db/schema";
import { eq, and, asc, gt, sql } from "drizzle-orm";
import { safe, ok, readJson, str, rateLimit, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";
import { mediaUrl } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };
export const dynamic = "force-dynamic";

async function assertMember(conversationId: string, userId: string) {
  const member = await db
    .select()
    .from(conversationParticipants)
    .where(and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, userId)))
    .limit(1);
  if (!member[0]) throw new ApiError(403, "You're not part of this conversation.");
  return member[0];
}

export async function GET(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    await assertMember(id, user.id);
    const after = new URL(req.url).searchParams.get("after");
    const rows = await db
      .select({ m: messages, v: videos })
      .from(messages)
      .leftJoin(videos, eq(videos.id, messages.videoId))
      .where(
        after
          ? and(eq(messages.conversationId, id), gt(messages.createdAt, new Date(after)))
          : eq(messages.conversationId, id)
      )
      .orderBy(asc(messages.createdAt))
      .limit(200);

    // Read receipt: everything up to now is read by this viewer.
    await db
      .update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(and(eq(conversationParticipants.conversationId, id), eq(conversationParticipants.userId, user.id)));

    const others = await db.execute(sql`
      SELECT MIN(cp.last_read_at) AS seen FROM conversation_participants cp
      WHERE cp.conversation_id = ${id} AND cp.user_id != ${user.id}
    `);
    const seenThrough = (others.rows[0] as Record<string, unknown>)?.seen;

    return ok({
      messages: rows.map(({ m, v }) => ({
        id: m.id,
        body: m.body,
        senderId: m.senderId,
        mine: m.senderId === user.id,
        createdAt: m.createdAt,
        video: v
          ? { id: v.id, caption: v.caption, thumbnailUrl: mediaUrl(v.thumbnailKey), author: "" }
          : null,
      })),
      seenThrough: seenThrough ? String(seenThrough) : null,
    });
  });
}

export async function POST(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    rateLimit(`msg:${user.id}`, 60, 60_000);
    await assertMember(id, user.id);
    const body = await readJson(req);
    const text = str(body.body, 1000);
    const videoId = str(body.videoId, 40) || null;
    if (!text && !videoId) throw new ApiError(400, "Message is empty.");
    if (videoId) {
      const v = await db.select({ id: videos.id }).from(videos).where(eq(videos.id, videoId)).limit(1);
      if (!v[0]) throw new ApiError(400, "Shared video no longer exists.");
    }
    const [msg] = await db
      .insert(messages)
      .values({ conversationId: id, senderId: user.id, body: text, videoId })
      .returning();
    await db.update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, id));
    const peers = await db
      .select({ userId: conversationParticipants.userId, u: users })
      .from(conversationParticipants)
      .innerJoin(users, eq(users.id, conversationParticipants.userId))
      .where(and(eq(conversationParticipants.conversationId, id), sql`${conversationParticipants.userId} != ${user.id}`));
    for (const p of peers) {
      await notify({
        userId: p.userId, actorId: user.id, kind: "message", conversationId: id,
        body: text ? text.slice(0, 100) : "shared a video",
      });
    }
    return ok({ message: { id: msg.id, body: msg.body, senderId: msg.senderId, mine: true, createdAt: msg.createdAt, video: null } }, 201);
  });
}