import { redirect } from "next/navigation";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { queryVideos } from "@/lib/videos";
import { mediaUrl } from "@/lib/storage";
import { Landing } from "@/components/landing";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (user) redirect("/feed");

  const statsRes = await db.execute(sql`
    SELECT
      (SELECT COUNT(*)::int FROM users WHERE status = 'active') AS creators,
      (SELECT COUNT(*)::int FROM videos WHERE status = 'published') AS videos,
      (SELECT COUNT(*)::int FROM likes) AS likes
  `);
  const s = (statsRes.rows[0] ?? {}) as Record<string, unknown>;

  const tagRes = await db.execute(sql`
    SELECT h.name, COUNT(vh.video_id)::int AS uses
    FROM hashtags h JOIN video_hashtags vh ON vh.hashtag_id = h.id
    JOIN videos v ON v.id = vh.video_id AND v.status = 'published'
    GROUP BY h.id ORDER BY uses DESC LIMIT 10
  `);

  const creatorRes = await db.execute(sql`
    SELECT u.username, u.display_name, u.avatar_url,
      (SELECT COUNT(*)::int FROM follows f WHERE f.followee_id = u.id) AS followers,
      (SELECT COUNT(*)::int FROM videos v WHERE v.user_id = u.id AND v.status = 'published') AS videos
    FROM users u
    WHERE u.status = 'active' AND EXISTS(SELECT 1 FROM videos v WHERE v.user_id = u.id AND v.status = 'published')
    ORDER BY followers DESC LIMIT 4
  `);

  const heroes = await queryVideos({ viewerId: null, limit: 1 });

  return (
    <Landing
      stats={{ creators: Number(s.creators ?? 0), videos: Number(s.videos ?? 0), likes: Number(s.likes ?? 0) }}
      tags={(tagRes.rows as Record<string, unknown>[]).map((r) => String(r.name))}
      creators={(creatorRes.rows as Record<string, unknown>[]).map((r) => ({
        username: String(r.username),
        displayName: String(r.display_name),
        avatarUrl: r.avatar_url ? (String(r.avatar_url).startsWith("avatars/") ? mediaUrl(String(r.avatar_url)) : String(r.avatar_url)) : null,
        followers: Number(r.followers),
        videos: Number(r.videos),
      }))}
      hero={heroes[0] ?? null}
    />
  );
}
