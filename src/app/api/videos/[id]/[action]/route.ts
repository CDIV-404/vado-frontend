import { db } from "@/db";
import { videos, likes, saves, reposts, watchEvents, reports } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { safe, ok, readJson, str, rateLimit, clientIp, ApiError, clampInt } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getVideoById } from "@/lib/videos";
import { notify } from "@/lib/notify";

type Ctx = { params: Promise<{ id: string; action: string }> };

async function countOf(table: "likes" | "saves" | "reposts", videoId: string) {
  const t = table === "likes" ? likes : table === "saves" ? saves : reposts;
  const r = await db.select({ n: sql<number>`COUNT(*)::int` }).from(t).where(eq(t.videoId, videoId));
  return r[0]?.n ?? 0;
}

export async function POST(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { id, action } = await ctx.params;
    const user = await requireUser();
    rateLimit(`act:${user.id}`, 120, 60_000);

    if (action === "view") {
      const body = await readJson(req);
      const watchedMs = clampInt(body.watchedMs, 0, 3_600_000, 0);
      const durationMs = clampInt(body.durationMs, 0, 3_600_000, 0);
      const completed = Boolean(body.completed);
      const exists = await db.select({ id: videos.id }).from(videos).where(and(eq(videos.id, id), eq(videos.status, "published"))).limit(1);
      if (!exists[0]) throw new ApiError(404, "Video not found.");
      await db.insert(watchEvents).values({ userId: user.id, videoId: id, watchedMs, durationMs, completed });
      if (watchedMs >= 1000) {
        await db.update(videos).set({ viewCount: sql`${videos.viewCount} + 1` }).where(eq(videos.id, id));
      }
      return ok({ ok: true });
    }

    const video = await getVideoById(id, user.id);
    if (!video) throw new ApiError(404, "This video is unavailable.");

    if (action === "like" || action === "save" || action === "repost") {
      const table = action === "like" ? likes : action === "save" ? saves : reposts;
      const inserted = await db
        .insert(table)
        .values({ userId: user.id, videoId: id })
        .onConflictDoNothing()
        .returning();
      let active: boolean;
      if (inserted.length) {
        active = true;
        if (action === "like") {
          await notify({ userId: video.author.id, actorId: user.id, kind: "like", videoId: id });
        } else if (action === "repost") {
          await notify({ userId: video.author.id, actorId: user.id, kind: "system", videoId: id, body: "reposted your video" });
        }
      } else {
        await db.delete(table).where(and(eq(table.userId, user.id), eq(table.videoId, id)));
        active = false;
      }
      const count = await countOf(action === "like" ? "likes" : action === "save" ? "saves" : "reposts", id);
      return ok({ active, count });
    }

    if (action === "share") {
      await db.update(videos).set({ shareCount: sql`${videos.shareCount} + 1` }).where(eq(videos.id, id));
      await notify({ userId: video.author.id, actorId: user.id, kind: "system", videoId: id, body: "shared your video" });
      return ok({ count: video.counts.shares + 1 });
    }

    if (action === "report") {
      rateLimit(`report:${user.id}`, 10, 60 * 60_000);
      const body = await readJson(req);
      const reason = str(body.reason, 80);
      if (!reason) throw new ApiError(400, "Choose a reason for the report.");
      await db.insert(reports).values({
        reporterId: user.id, targetType: "video", targetId: id, reason, details: str(body.details, 1000),
      });
      return ok({ ok: true }, 201);
    }

    throw new ApiError(404, "Unknown action.");
  });
}

/** Guests can still log watch time for view counts. */
export async function PUT(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { id, action } = await ctx.params;
    if (action !== "view") throw new ApiError(404, "Unknown action.");
    rateLimit(`view:${clientIp(req)}`, 240, 60_000);
    const body = await readJson(req);
    const watchedMs = clampInt(body.watchedMs, 0, 3_600_000, 0);
    const durationMs = clampInt(body.durationMs, 0, 3_600_000, 0);
    const exists = await db.select({ id: videos.id }).from(videos).where(and(eq(videos.id, id), eq(videos.status, "published"))).limit(1);
    if (!exists[0]) throw new ApiError(404, "Video not found.");
    await db.insert(watchEvents).values({ userId: null, videoId: id, watchedMs, durationMs, completed: Boolean(body.completed) });
    if (watchedMs >= 1000) {
      await db.update(videos).set({ viewCount: sql`${videos.viewCount} + 1` }).where(eq(videos.id, id));
    }
    return ok({ ok: true });
  });
}