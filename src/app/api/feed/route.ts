import { sql } from "drizzle-orm";
import { safe, ok, clampInt, ApiError } from "@/lib/api";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { forYouFeed, queryVideos } from "@/lib/videos";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return safe(async () => {
    const url = new URL(req.url);
    const tab = url.searchParams.get("tab") === "following" ? "following" : "foryou";
    const hashtag = (url.searchParams.get("hashtag") || "").toLowerCase().slice(0, 40);
    const category = (url.searchParams.get("category") || "").toLowerCase().slice(0, 40);
    const offset = clampInt(url.searchParams.get("offset"), 0, 5000, 0);
    const limit = clampInt(url.searchParams.get("limit"), 1, 12, 6);
    const viewer = await getCurrentUser();

    const filters = [];
    if (hashtag) {
      filters.push(sql`EXISTS(SELECT 1 FROM video_hashtags vh JOIN hashtags h ON h.id = vh.hashtag_id
        WHERE vh.video_id = v.id AND h.name = ${hashtag})`);
    }
    if (category) filters.push(sql`c.slug = ${category}`);

    if (tab === "following") {
      const user = await requireUser();
      filters.push(sql`EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${user.id} AND f.followee_id = v.user_id)`);
      const extra = filters.length ? sql.join(filters, sql` AND `) : undefined;
      const videos = await queryVideos({ viewerId: user.id, extra, limit: limit + 1, offset });
      return ok({ videos: videos.slice(0, limit), hasMore: videos.length > limit });
    }

    if (filters.length) {
      const extra = sql.join(filters, sql` AND `);
      const videos = await queryVideos({ viewerId: viewer?.id ?? null, extra, limit: limit + 1, offset });
      return ok({ videos: videos.slice(0, limit), hasMore: videos.length > limit, hashtag, category });
    }

    const result = await forYouFeed(viewer, offset, limit);
    return ok(result);
  });
}


