import { db } from "@/db";
import { hashtags, videoHashtags, type User } from "@/db/schema";
import { inArray, sql, type SQL } from "drizzle-orm";
import { mediaUrl } from "@/lib/storage";

/* ─── DTOs ─────────────────────────────────────────────────── */

export type VideoDTO = {
  id: string;
  caption: string;
  hashtags: string[];
  videoUrl: string;
  thumbnailUrl: string | null;
  durationMs: number;
  width: number;
  height: number;
  visibility: string;
  status: string;
  soundTitle: string;
  category: { slug: string; name: string } | null;
  counts: { likes: number; comments: number; saves: number; reposts: number; shares: number; views: number };
  viewer: { liked: boolean; saved: boolean; reposted: boolean; followingAuthor: boolean };
  author: { id: string; username: string; displayName: string; avatarUrl: string | null };
  createdAt: string;
};

type Row = Record<string, unknown>;

function serialize(r: Row, tags: string[]): VideoDTO {
  return {
    id: String(r.id),
    caption: String(r.caption ?? ""),
    hashtags: tags,
    videoUrl: mediaUrl(String(r.video_key))!,
    thumbnailUrl: mediaUrl(r.thumbnail_key ? String(r.thumbnail_key) : null),
    durationMs: Number(r.duration_ms ?? 0),
    width: Number(r.width ?? 1080),
    height: Number(r.height ?? 1920),
    visibility: String(r.visibility),
    status: String(r.status),
    soundTitle: String(r.sound_title ?? "Original sound"),
    category: r.category_slug ? { slug: String(r.category_slug), name: String(r.category_name) } : null,
    counts: {
      likes: Number(r.like_count ?? 0),
      comments: Number(r.comment_count ?? 0),
      saves: Number(r.save_count ?? 0),
      reposts: Number(r.repost_count ?? 0),
      shares: Number(r.share_count ?? 0),
      views: Number(r.view_count ?? 0),
    },
    viewer: {
      liked: Boolean(r.viewer_liked),
      saved: Boolean(r.viewer_saved),
      reposted: Boolean(r.viewer_reposted),
      followingAuthor: Boolean(r.viewer_following),
    },
    author: {
      id: String(r.user_id),
      username: String(r.username),
      displayName: String(r.display_name),
      avatarUrl: mediaUrl(r.avatar_url && String(r.avatar_url).startsWith("avatars/") ? String(r.avatar_url) : null) ??
        (r.avatar_url ? String(r.avatar_url) : null),
    },
    createdAt: new Date(String(r.created_at)).toISOString(),
  };
}

async function attachTags(rows: Row[]): Promise<VideoDTO[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => String(r.id));
  const tagRows = await db
    .select({ videoId: videoHashtags.videoId, name: hashtags.name })
    .from(videoHashtags)
    .innerJoin(hashtags, eqJoin())
    .where(inArray(videoHashtags.videoId, ids));
  const map = new Map<string, string[]>();
  for (const t of tagRows) {
    const arr = map.get(t.videoId) ?? [];
    arr.push(t.name);
    map.set(t.videoId, arr);
  }
  return rows.map((r) => serialize(r, map.get(String(r.id)) ?? []));
}

function eqJoin(): SQL {
  return sql`${hashtags.id} = ${videoHashtags.hashtagId}`;
}

/* ─── Core query: counts, viewer flags, visibility, blocks ─── */

export async function queryVideos(opts: {
  viewerId: string | null;
  extra?: SQL;
  joins?: SQL;
  orderBy?: SQL;
  limit: number;
  offset?: number;
  includeUnpublished?: boolean;
}): Promise<VideoDTO[]> {
  const { viewerId, extra, joins, orderBy, limit, offset = 0, includeUnpublished } = opts;
  const statusCond = includeUnpublished
    ? sql`v.status IN ('published','draft')`
    : sql`v.status = 'published'`;
  const result = await db.execute(sql`
    SELECT v.*,
      u.username, u.display_name, u.avatar_url,
      c.slug AS category_slug, c.name AS category_name,
      (SELECT COUNT(*)::int FROM likes l WHERE l.video_id = v.id) AS like_count,
      (SELECT COUNT(*)::int FROM comments cm WHERE cm.video_id = v.id AND cm.status = 'visible') AS comment_count,
      (SELECT COUNT(*)::int FROM saves s WHERE s.video_id = v.id) AS save_count,
      (SELECT COUNT(*)::int FROM reposts r WHERE r.video_id = v.id) AS repost_count,
      EXISTS(SELECT 1 FROM likes l WHERE l.video_id = v.id AND l.user_id = ${viewerId}) AS viewer_liked,
      EXISTS(SELECT 1 FROM saves s WHERE s.video_id = v.id AND s.user_id = ${viewerId}) AS viewer_saved,
      EXISTS(SELECT 1 FROM reposts r WHERE r.video_id = v.id AND r.user_id = ${viewerId}) AS viewer_reposted,
      EXISTS(SELECT 1 FROM follows f WHERE f.follower_id = ${viewerId} AND f.followee_id = v.user_id) AS viewer_following
    FROM videos v
    JOIN users u ON u.id = v.user_id
    LEFT JOIN categories c ON c.id = v.category_id
    ${joins ?? sql``}
    WHERE ${statusCond}
      AND u.status = 'active'
      AND (
        v.visibility = 'public'
        OR v.user_id = ${viewerId}
        OR (v.visibility = 'followers' AND EXISTS(
          SELECT 1 FROM follows f WHERE f.follower_id = ${viewerId} AND f.followee_id = v.user_id))
      )
      AND NOT EXISTS(
        SELECT 1 FROM blocks b WHERE
          (b.blocker_id = ${viewerId} AND b.blocked_id = v.user_id) OR
          (b.blocked_id = ${viewerId} AND b.blocker_id = v.user_id))
      ${extra ? sql`AND ${extra}` : sql``}
    ORDER BY ${orderBy ?? sql`v.created_at DESC`}
    LIMIT ${limit} OFFSET ${offset}
  `);
  return attachTags(result.rows as Row[]);
}

export async function getVideoById(id: string, viewerId: string | null): Promise<VideoDTO | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const rows = await queryVideos({ viewerId, extra: sql`v.id = ${id}`, limit: 1 });
  return rows[0] ?? null;
}

/* ─── Recommendation engine (v1: transparent heuristic) ───────
   score = engagement + completion + interest affinity +
           follow boost + recency − already-watched penalty.
   Deterministic per (viewer, video, day) jitter adds variety.
   The module is isolated so a learned ranker can replace it. */

function jitter(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

export async function categoryAffinity(userId: string): Promise<Map<string, number>> {
  const res = await db.execute(sql`
    SELECT category_id, SUM(w)::float AS weight FROM (
      SELECT v.category_id, 3.0 AS w FROM likes l JOIN videos v ON v.id = l.video_id WHERE l.user_id = ${userId}
      UNION ALL
      SELECT v.category_id, 4.0 AS w FROM saves s JOIN videos v ON v.id = s.video_id WHERE s.user_id = ${userId}
      UNION ALL
      SELECT v.category_id, CASE WHEN w.completed THEN 2.5 ELSE 1.0 END AS w
        FROM watch_events w JOIN videos v ON v.id = w.video_id WHERE w.user_id = ${userId}
      UNION ALL
      SELECT v.category_id, 2.0 AS w FROM comments cm JOIN videos v ON v.id = cm.video_id WHERE cm.user_id = ${userId}
    ) t WHERE category_id IS NOT NULL GROUP BY category_id
  `);
  const map = new Map<string, number>();
  let max = 1;
  for (const r of res.rows as Row[]) {
    const w = Number(r.weight);
    map.set(String(r.category_id), w);
    if (w > max) max = w;
  }
  for (const [k, v] of map) map.set(k, v / max);
  return map;
}

export async function forYouFeed(viewer: User | null, offset: number, limit: number) {
  const pool = await queryVideos({ viewerId: viewer?.id ?? null, limit: 160 });
  let affinity = new Map<string, number>();
  const watched = new Map<string, number>();
  const interestSlugs = new Set(viewer?.interests ?? []);
  if (viewer) {
    affinity = await categoryAffinity(viewer.id);
    const w = await db.execute(sql`
      SELECT video_id, MAX(CASE WHEN completed THEN 2 ELSE 1 END)::int AS level
      FROM watch_events WHERE user_id = ${viewer.id} GROUP BY video_id
    `);
    for (const r of w.rows as Row[]) watched.set(String(r.video_id), Number(r.level));
  }
  const catIdBySlug = await db.execute(sql`SELECT id, slug FROM categories`);
  const slugToId = new Map((catIdBySlug.rows as Row[]).map((r) => [String(r.slug), String(r.id)]));
  const day = new Date().toISOString().slice(0, 10);
  const now = Date.now();

  const scored = pool.map((v) => {
    const ageH = Math.max(1, (now - new Date(v.createdAt).getTime()) / 3600_000);
    const engagement =
      Math.log1p(v.counts.likes * 3 + v.counts.comments * 5 + v.counts.saves * 4 + v.counts.reposts * 6 + v.counts.shares * 4);
    const completion = v.durationMs > 0 ? Math.min(1, v.counts.views / Math.max(1, v.counts.views)) : 0;
    let interest = 0;
    if (v.category) {
      const cid = slugToId.get(v.category.slug);
      if (cid && affinity.has(cid)) interest += affinity.get(cid)! * 2.5;
      if (interestSlugs.has(v.category.slug)) interest += 2.0;
    }
    const followBoost = v.viewer.followingAuthor ? 1.6 : 0;
    const recency = 3.2 * Math.exp(-ageH / 96);
    const seen = watched.get(v.id) ?? 0;
    const seenPenalty = seen === 2 ? 7 : seen === 1 ? 3.5 : 0;
    const variety = jitter(`${v.id}:${viewer?.id ?? "guest"}:${day}`) * 1.4;
    return { v, score: engagement + completion + interest + followBoost + recency + variety - seenPenalty };
  });
  scored.sort((a, b) => b.score - a.score);
  const page = scored.slice(offset, offset + limit).map((s) => s.v);
  return { videos: page, hasMore: offset + limit < scored.length, total: scored.length };
}

/* ─── Hashtag helpers ──────────────────────────────────────── */

export function extractHashtags(caption: string): string[] {
  const tags = (caption.match(/#([\p{L}\p{N}_]{1,40})/gu) || []).map((t) => t.slice(1).toLowerCase());
  return [...new Set(tags)].slice(0, 12);
}

export async function syncVideoHashtags(videoId: string, caption: string) {
  const names = extractHashtags(caption);
  await db.delete(videoHashtags).where(sql`${videoHashtags.videoId} = ${videoId}`);
  for (const name of names) {
    await db.insert(hashtags).values({ name }).onConflictDoNothing();
    const tag = await db.select().from(hashtags).where(sql`${hashtags.name} = ${name}`).limit(1);
    if (tag[0]) {
      await db.insert(videoHashtags).values({ videoId, hashtagId: tag[0].id }).onConflictDoNothing();
    }
  }
}