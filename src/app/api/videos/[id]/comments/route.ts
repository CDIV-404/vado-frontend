import { db } from "@/db";
import { comments, users, videos } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { safe, ok, readJson, str, rateLimit, ApiError } from "@/lib/api";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { notify, notifyMentions } from "@/lib/notify";
import { mediaUrl } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

function avatar(u: { avatarUrl: string | null }) {
  if (!u.avatarUrl) return null;
  return u.avatarUrl.startsWith("avatars/") ? mediaUrl(u.avatarUrl) : u.avatarUrl;
}

export async function GET(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { id } = await ctx.params;
    const viewer = await getCurrentUser();
    const rows = await db
      .select({ c: comments, u: users })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.userId))
      .where(and(eq(comments.videoId, id), eq(comments.status, "visible")))
      .orderBy(asc(comments.createdAt))
      .limit(400);

    type DTO = {
      id: string; body: string; createdAt: Date; parentId: string | null;
      canDelete: boolean;
      user: { id: string; username: string; displayName: string; avatarUrl: string | null };
      replies: DTO[];
    };
    const map = new Map<string, DTO>();
    for (const { c, u } of rows) {
      map.set(c.id, {
        id: c.id, body: c.body, createdAt: c.createdAt, parentId: c.parentId,
        canDelete: !!viewer && (viewer.id === c.userId || viewer.role === "admin"),
        user: { id: u.id, username: u.username, displayName: u.displayName, avatarUrl: avatar(u) },
        replies: [],
      });
    }
    const roots: DTO[] = [];
    for (const dto of map.values()) {
      if (dto.parentId && map.has(dto.parentId)) map.get(dto.parentId)!.replies.push(dto);
      else roots.push(dto);
    }
    roots.reverse();
    return ok({ comments: roots, total: rows.length });
  });
}

export async function POST(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    rateLimit(`comment:${user.id}`, 30, 5 * 60_000);
    const body = await readJson(req);
    const text = str(body.body, 500);
    const parentId = str(body.parentId, 40) || null;
    if (!text) throw new ApiError(400, "Write something first.");

    const vid = await db.select().from(videos).where(and(eq(videos.id, id), eq(videos.status, "published"))).limit(1);
    if (!vid[0]) throw new ApiError(404, "Video not found.");

    let parent: typeof comments.$inferSelect | null = null;
    if (parentId) {
      const p = await db.select().from(comments).where(and(eq(comments.id, parentId), eq(comments.videoId, id))).limit(1);
      if (!p[0]) throw new ApiError(400, "The comment you're replying to no longer exists.");
      parent = p[0];
    }

    const [created] = await db
      .insert(comments)
      .values({ videoId: id, userId: user.id, body: text, parentId: parent ? (parent.parentId ?? parent.id) : null })
      .returning();

    if (parent) {
      await notify({ userId: parent.userId, actorId: user.id, kind: "reply", videoId: id, commentId: created.id, body: text.slice(0, 140) });
    } else {
      await notify({ userId: vid[0].userId, actorId: user.id, kind: "comment", videoId: id, commentId: created.id, body: text.slice(0, 140) });
    }
    await notifyMentions(text, user.id, id, created.id, parent?.userId ?? vid[0].userId);

    return ok({
      comment: {
        id: created.id, body: created.body, createdAt: created.createdAt, parentId: created.parentId,
        canDelete: true,
        user: { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: avatar(user) },
        replies: [],
      },
    }, 201);
  });
}
