import { db } from "@/db";
import { users } from "@/db/schema";
import { sql } from "drizzle-orm";
import { safe, ok, clampInt } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { queryVideos } from "@/lib/videos";
import { mediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

function avatarOf(v: string | null) {
  if (!v) return null;
  return v.startsWith("avatars/") ? mediaUrl(v) : v;
}

export async function GET(req: Request) {
  return safe(async () => {
    const url = new URL(req.url);
    const raw = (url.searchParams.get("q") || "").trim().slice(0, 80);
    const type = url.searchParams.get("type") || "top";
    const suggest = url.searchParams.get("suggest") === "1";
    const offset = clampInt(url.searchParams.get("offset"), 0, 500, 0);
    const q = raw.replace(/^[#@]/, "");
    if (!q) return ok({ users: [], videos: [], hashtags: [], sounds: [] });
    const viewer = await getCurrentUser();
    const like = `%${q.replace(/[%_]/g, "")}%`;

    const userLimit = suggest ? 4 : type === "users" ? 24 : 6;
    const tagLimit = suggest ? 5 : type === "hashtags" ? 24 : 8;

    const userRows = await db.execute(sql`
      SELECT u.id, u.username, u.display_name, u.avatar_url, u.bio,
        (SELECT COUNT(*)::int FROM follows f WHERE f.followee_id = u.id) AS followers,
        EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${viewer?.id ?? null} AND f.followee_id = u.id) AS viewer_following
      FROM users u
      WHERE u.status = 'active' AND (u.username ILIKE ${like} OR u.display_name ILIKE ${like})
      ORDER BY followers DESC LIMIT ${userLimit}
    `);
    const usersOut = (userRows.rows as Record<string, unknown>[]).map((r) => ({
      id: String(r.id), username: String(r.username), displayName: String(r.display_name),
      avatarUrl: avatarOf(r.avatar_url ? String(r.avatar_url) : null), bio: String(r.bio ?? ""),
      followers: Number(r.followers ?? 0), viewerFollowing: Boolean(r.viewer_following),
    }));

    const tagRows = await db.execute(sql`
      SELECT h.name, COUNT(vh.video_id)::int AS uses,
        (SELECT v.id FROM video_hashtags x JOIN videos v ON v.id = x.video_id AND v.status='published'
          WHERE x.hashtag_id = h.id ORDER BY v.created_at DESC LIMIT 1) AS sample_video
      FROM hashtags h LEFT JOIN video_hashtags vh ON vh.hashtag_id = h.id
      WHERE h.name ILIKE ${`${q.replace(/[%_]/g, "")}%`}
      GROUP BY h.id ORDER BY uses DESC LIMIT ${tagLimit}
    `);
    const hashtagsOut = (tagRows.rows as Record<string, unknown>[]).map((r) => ({
      name: String(r.name), uses: Number(r.uses ?? 0), sampleVideoId: r.sample_video ? String(r.sample_video) : null,
    }));

    if (suggest) return ok({ users: usersOut, hashtags: hashtagsOut, videos: [], sounds: [] });

    let videos: Awaited<ReturnType<typeof queryVideos>> = [];
    if (type === "top" || type === "videos") {
      videos = await queryVideos({
        viewerId: viewer?.id ?? null,
        extra: sql`(v.caption ILIKE ${like} OR v.sound_title ILIKE ${like} OR EXISTS(
          SELECT 1 FROM video_hashtags vh JOIN hashtags h ON h.id = vh.hashtag_id
          WHERE vh.video_id = v.id AND h.name ILIKE ${like}))`,
        limit: type === "videos" ? 25 : 12,
        offset,
      });
    }

    let soundsOut: { title: string; uses: number; sampleVideoId: string }[] = [];
    if (type === "top" || type === "sounds") {
      const soundRows = await db.execute(sql`
        SELECT v.sound_title AS title, COUNT(*)::int AS uses, MIN(v.id::text) AS sample
        FROM videos v WHERE v.status = 'published' AND v.sound_title ILIKE ${like}
        GROUP BY v.sound_title ORDER BY uses DESC LIMIT 12
      `);
      soundsOut = (soundRows.rows as Record<string, unknown>[]).map((r) => ({
        title: String(r.title), uses: Number(r.uses), sampleVideoId: String(r.sample),
      }));
    }

    return ok({ users: usersOut, videos, hashtags: hashtagsOut, sounds: soundsOut });
  });
}
