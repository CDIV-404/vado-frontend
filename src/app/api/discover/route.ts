import { db } from "@/db";
import { sql } from "drizzle-orm";
import { safe, ok } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  return safe(async () => {
    const viewer = await getCurrentUser();
    const trending = await db.execute(sql`
      SELECT h.name,
        COUNT(vh.video_id)::int AS total,
        COUNT(vh.video_id) FILTER (WHERE v.created_at > NOW() - INTERVAL '7 days')::int AS recent,
        (SELECT v2.thumbnail_key FROM video_hashtags x JOIN videos v2 ON v2.id = x.video_id AND v2.status = 'published'
          WHERE x.hashtag_id = h.id ORDER BY v2.created_at DESC LIMIT 1) AS thumb
      FROM hashtags h
      JOIN video_hashtags vh ON vh.hashtag_id = h.id
      JOIN videos v ON v.id = vh.video_id AND v.status = 'published'
      GROUP BY h.id ORDER BY recent DESC, total DESC LIMIT 10
    `);
    const cats = await db.execute(sql`
      SELECT c.slug, c.name, c.hue, COUNT(v.id)::int AS videos,
        COALESCE(SUM(v.view_count), 0)::int AS views
      FROM categories c LEFT JOIN videos v ON v.category_id = c.id AND v.status = 'published'
      GROUP BY c.id ORDER BY videos DESC
    `);
    const creators = await db.execute(sql`
      SELECT u.id, u.username, u.display_name, u.avatar_url,
        (SELECT COUNT(*)::int FROM follows f WHERE f.followee_id = u.id) AS followers,
        (SELECT COUNT(*)::int FROM videos v WHERE v.user_id = u.id AND v.status = 'published') AS videos,
        EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${viewer?.id ?? null} AND f.followee_id = u.id) AS viewer_following
      FROM users u WHERE u.status = 'active'
      ORDER BY followers DESC, videos DESC LIMIT 6
    `);
    return ok({
      trending: (trending.rows as Record<string, unknown>[]).map((r) => ({
        name: String(r.name),
        total: Number(r.total),
        recent: Number(r.recent),
        thumbnailUrl: mediaUrl(r.thumb ? String(r.thumb) : null),
      })),
      categories: (cats.rows as Record<string, unknown>[]).map((r) => ({
        slug: String(r.slug), name: String(r.name), hue: String(r.hue),
        videos: Number(r.videos), views: Number(r.views),
      })),
      creators: (creators.rows as Record<string, unknown>[]).map((r) => ({
        id: String(r.id), username: String(r.username), displayName: String(r.display_name),
        avatarUrl: r.avatar_url ? (String(r.avatar_url).startsWith("avatars/") ? mediaUrl(String(r.avatar_url)) : String(r.avatar_url)) : null,
        followers: Number(r.followers), videos: Number(r.videos), viewerFollowing: Boolean(r.viewer_following),
      })),
    });
  });
}
