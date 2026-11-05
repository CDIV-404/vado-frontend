import { db } from "@/db";
import { notifications, users, videos } from "@/db/schema";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import { safe, ok, readJson, clampInt } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return safe(async () => {
    const user = await requireUser();
    const offset = clampInt(new URL(req.url).searchParams.get("offset"), 0, 2000, 0);
    const rows = await db
      .select({ n: notifications, a: users, v: videos })
      .from(notifications)
      .leftJoin(users, eq(users.id, notifications.actorId))
      .leftJoin(videos, eq(videos.id, notifications.videoId))
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(31)
      .offset(offset);
    const unread = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
    return ok({
      notifications: rows.slice(0, 30).map(({ n, a, v }) => ({
        id: n.id,
        kind: n.kind,
        body: n.body,
        read: n.read,
        createdAt: n.createdAt,
        videoId: n.videoId,
        videoThumb: mediaUrl(v?.thumbnailKey),
        conversationId: n.conversationId,
        actor: a
          ? {
              username: a.username,
              displayName: a.displayName,
              avatarUrl: a.avatarUrl ? (a.avatarUrl.startsWith("avatars/") ? mediaUrl(a.avatarUrl) : a.avatarUrl) : null,
            }
          : null,
      })),
      hasMore: rows.length > 30,
      unread: unread[0]?.n ?? 0,
    });
  });
}

export async function POST(req: Request) {
  return safe(async () => {
    const user = await requireUser();
    const body = await readJson(req);
    if (body.action === "read_all") {
      await db.update(notifications).set({ read: true }).where(eq(notifications.userId, user.id));
    } else if (Array.isArray(body.ids)) {
      const ids = (body.ids as unknown[]).filter((i): i is string => typeof i === "string").slice(0, 50);
      if (ids.length) {
        await db
          .update(notifications)
          .set({ read: true })
          .where(and(eq(notifications.userId, user.id), inArray(notifications.id, ids)));
      }
    }
    return ok({ ok: true });
  });
}
