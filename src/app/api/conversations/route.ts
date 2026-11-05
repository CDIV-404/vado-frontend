import { db } from "@/db";
import { conversations, conversationParticipants, messages, users, blocks } from "@/db/schema";
import { eq, and, sql, desc, inArray, ne } from "drizzle-orm";
import { safe, ok, readJson, str, rateLimit, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

function avatarOf(v: string | null) {
  if (!v) return null;
  return v.startsWith("avatars/") ? mediaUrl(v) : v;
}

export async function GET() {
  return safe(async () => {
    const user = await requireUser();
    const rows = await db.execute(sql`
      SELECT c.id, c.is_group, c.title, c.last_message_at,
        cp.last_read_at,
        (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_body,
        (SELECT m.sender_id FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_sender,
        (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id
          AND m.created_at > cp.last_read_at AND m.sender_id != ${user.id}) AS unread
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = ${user.id}
      ORDER BY c.last_message_at DESC LIMIT 50
    `);
    const ids = (rows.rows as Record<string, unknown>[]).map((r) => String(r.id));
    let participants: { conversationId: string; id: string; username: string; displayName: string; avatarUrl: string | null }[] = [];
    if (ids.length) {
      const p = await db
        .select({
          conversationId: conversationParticipants.conversationId,
          id: users.id,
          username: users.username,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        })
        .from(conversationParticipants)
        .innerJoin(users, eq(users.id, conversationParticipants.userId))
        .where(and(inArray(conversationParticipants.conversationId, ids), ne(users.id, user.id)));
      participants = p;
    }
    return ok({
      conversations: (rows.rows as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        isGroup: Boolean(r.is_group),
        title: String(r.title ?? ""),
        lastMessageAt: String(r.last_message_at),
        lastBody: r.last_body ? String(r.last_body) : "",
        lastSenderIsMe: r.last_sender ? String(r.last_sender) === user.id : false,
        unread: Number(r.unread ?? 0),
        seenThrough: String(r.last_read_at),
        members: participants
          .filter((p) => p.conversationId === String(r.id))
          .map((p) => ({
            id: p.id, username: p.username, displayName: p.displayName,
            avatarUrl: avatarOf(p.avatarUrl),
          })),
      })),
    });
  });
}

export async function POST(req: Request) {
  return safe(async () => {
    const user = await requireUser();
    rateLimit(`convo:${user.id}`, 30, 60_000);
    const body = await readJson(req);
    const userId = str(body.userId, 40);
    if (!userId || userId === user.id) throw new ApiError(400, "Pick someone to message.");
    const target = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!target[0] || target[0].status !== "active") throw new ApiError(404, "Account not found.");
    const blocked = await db
      .select()
      .from(blocks)
      .where(
        and(
          sql`((${blocks.blockerId} = ${user.id} AND ${blocks.blockedId} = ${userId}) OR
               (${blocks.blockerId} = ${userId} AND ${blocks.blockedId} = ${user.id}))`
        )
      )
      .limit(1);
    if (blocked.length) throw new ApiError(403, "Messaging is unavailable with this account.");

    const existing = await db.execute(sql`
      SELECT c.id FROM conversations c
      WHERE c.is_group = FALSE
        AND EXISTS(SELECT 1 FROM conversation_participants p WHERE p.conversation_id = c.id AND p.user_id = ${user.id})
        AND EXISTS(SELECT 1 FROM conversation_participants p WHERE p.conversation_id = c.id AND p.user_id = ${userId})
      LIMIT 1
    `);
    if (existing.rows[0]) return ok({ id: String((existing.rows[0] as Record<string, unknown>).id) });

    const [convo] = await db.insert(conversations).values({ isGroup: false }).returning();
    await db.insert(conversationParticipants).values([
      { conversationId: convo.id, userId: user.id },
      { conversationId: convo.id, userId },
    ]);
    return ok({ id: convo.id }, 201);
  });
}

/** Latest message poll used by the chat pane. */
export async function PUT(req: Request) {
  return safe(async () => {
    const user = await requireUser();
    const rows = await db
      .select({ m: messages })
      .from(messages)
      .innerJoin(conversationParticipants, and(
        eq(conversationParticipants.conversationId, messages.conversationId),
        eq(conversationParticipants.userId, user.id)
      ))
      .orderBy(desc(messages.createdAt))
      .limit(1);
    return ok({ latest: rows[0]?.m.createdAt ?? null });
  });
}
