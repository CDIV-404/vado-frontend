import { db } from "@/db";
import { sql } from "drizzle-orm";
import { safe, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return safe(async () => {
    await requireAdmin();
    const totals = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM users) AS users,
        (SELECT COUNT(*)::int FROM users WHERE created_at > NOW() - INTERVAL '7 days') AS new_users,
        (SELECT COUNT(*)::int FROM users WHERE status = 'suspended') AS suspended,
        (SELECT COUNT(*)::int FROM videos WHERE status = 'published') AS videos,
        (SELECT COUNT(*)::int FROM videos WHERE status = 'draft') AS drafts,
        (SELECT COUNT(*)::int FROM likes) AS likes,
        (SELECT COUNT(*)::int FROM comments WHERE status = 'visible') AS comments,
        (SELECT COUNT(*)::int FROM follows) AS follows,
        (SELECT COUNT(*)::int FROM reports WHERE status = 'open') AS open_reports,
        (SELECT COALESCE(SUM(view_count), 0)::int FROM videos) AS views
    `);
    const daily = await db.execute(sql`
      SELECT d.day::text AS day,
        (SELECT COUNT(*)::int FROM users u WHERE u.created_at::date = d.day) AS signups,
        (SELECT COUNT(*)::int FROM videos v WHERE v.created_at::date = d.day AND v.status = 'published') AS uploads,
        (SELECT COUNT(*)::int FROM watch_events w WHERE w.created_at::date = d.day) AS views
      FROM (SELECT generate_series(CURRENT_DATE - INTERVAL '13 days', CURRENT_DATE, '1 day')::date AS day) d
      ORDER BY d.day
    `);
    return ok({ totals: totals.rows[0], daily: daily.rows });
  });
}
