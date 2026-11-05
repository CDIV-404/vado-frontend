import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { safe, ok, clampInt, ApiError } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { queryVideos } from "@/lib/videos";
import { mediaUrl } from "@/lib/storage";

type Ctx = { params: Promise<{ username: string }> };
export const dynamic = "force-dynamic";

export async function GET(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { username } = await ctx.params;
    const url = new URL(req.url);
    const tab = url.searchParams.get("tab") || "videos";
    const offset = clampInt(url.searchParams.get("offset"), 0, 2000, 0);
    const limit = clampInt(url.searchParams.get("limit"), 1, 30, 18);
    const viewer = await getCurrentUser();

    const rows = await db.select().from(users).where(sql`lower(${users.username}) = ${username.toLowerCase()}`).limit(1);
    const u = rows[0];
    if (!u || u.status !== "active") throw new ApiError(404, "This account doesn't exist.");
    const isSelf = viewer?.id === u.id;

    const stats = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM follows f WHERE f.followee_id = ${u.id}) AS followers,
        (SELECT COUNT(*)::int FROM follows f WHERE f.follower_id = ${u.id}) AS following,
        (SELECT COUNT(*)::int FROM videos v WHERE v.user_id = ${u.id} AND v.status = 'published') AS videos,
        (SELECT COALESCE(SUM((SELECT COUNT(*) FROM likes l WHERE l.video_id = v.id)), 0)::int
           FROM videos v WHERE v.user_id = ${u.id} AND v.status = 'published') AS likes_received,
        EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${viewer?.id ?? null} AND f.followee_id = ${u.id}) AS viewer_following,
        EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${u.id} AND f.followee_id = ${viewer?.id ?? null}) AS follows_you,
        EXISTS(SELECT 1 FROM blocks b WHERE b.blocker_id = ${viewer?.id ?? null} AND b.blocked_id = ${u.id}) AS viewer_blocked
    `);
    const s = (stats.rows[0] ?? {}) as Record<string, unknown>;

    const profile = {
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      bio: u.bio,
      avatarUrl: u.avatarUrl ? (u.avatarUrl.startsWith("avatars/") ? mediaUrl(u.avatarUrl) : u.avatarUrl) : null,
      likedVideosPublic: u.likedVideosPublic,
      createdAt: u.createdAt,
      counts: {
        followers: Number(s.followers ?? 0),
        following: Number(s.following ?? 0),
        videos: Number(s.videos ?? 0),
        likesReceived: Number(s.likes_received ?? 0),
      },
      viewer: {
        isSelf,
        following: Boolean(s.viewer_following),
        followsYou: Boolean(s.follows_you),
        blocked: Boolean(s.viewer_blocked),
      },
    };

    if (profile.viewer.blocked) {
      return ok({ profile, videos: [], hasMore: false, blocked: true });
    }

    let videos: Awaited<ReturnType<typeof queryVideos>> = [];
    let locked = false;
    if (tab === "videos") {
      videos = await queryVideos({ viewerId: viewer?.id ?? null, extra: sql`v.user_id = ${u.id}`, limit: limit + 1, offset });
    } else if (tab === "liked") {
      if (!u.likedVideosPublic && !isSelf) locked = true;
      else {
        videos = await queryVideos({
          viewerId: viewer?.id ?? null,
          joins: sql`JOIN likes lk ON lk.video_id = v.id AND lk.user_id = ${u.id}`,
          orderBy: sql`lk.created_at DESC`,
          limit: limit + 1, offset,
        });
      }
    } else if (tab === "saved") {
      if (!isSelf) throw new ApiError(403, "Saved videos are private.");
      videos = await queryVideos({
        viewerId: viewer?.id ?? null,
        joins: sql`JOIN saves sv ON sv.video_id = v.id AND sv.user_id = ${u.id}`,
        orderBy: sql`sv.created_at DESC`,
        limit: limit + 1, offset,
      });
    } else if (tab === "reposts") {
      videos = await queryVideos({
        viewerId: viewer?.id ?? null,
        joins: sql`JOIN reposts rp ON rp.video_id = v.id AND rp.user_id = ${u.id}`,
        orderBy: sql`rp.created_at DESC`,
        limit: limit + 1, offset,
      });
    }

    return ok({ profile, videos: videos.slice(0, limit), hasMore: videos.length > limit, locked });
  });
}
