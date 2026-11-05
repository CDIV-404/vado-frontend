import { db } from "@/db";
import { sql } from "drizzle-orm";
import { safe, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { mediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return safe(async () => {
    await requireAdmin();
    const q = (new URL(req.url).searchParams.get("q") || "").slice(0, 60);
    const like = `%${q.replace(/[%_]/g, "")}%`;
    const rows = await db.execute(sql`
      SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, u.role, u.status,
        u.email_verified, u.created_at,
        (SELECT COUNT(*)::int FROM videos v WHERE v.user_id = u.id AND v.status = 'published') AS videos,
        (SELECT COUNT(*)::int FROM follows f WHERE f.followee_id = u.id) AS followers,
        (SELECT COUNT(*)::int FROM reports r WHERE r.target_type = 'user' AND r.target_id = u.id) AS reports
      FROM users u
      WHERE ${q ? sql`(u.username ILIKE ${like} OR u.email ILIKE ${like} OR u.display_name ILIKE ${like})` : sql`TRUE`}
      ORDER BY u.created_at DESC LIMIT 100
    `);
    return ok({
      users: (rows.rows as Record<string, unknown>[]).map((r) => ({
        id: String(r.id), email: String(r.email), username: String(r.username),
        displayName: String(r.display_name),
        avatarUrl: r.avatar_url ? (String(r.avatar_url).startsWith("avatars/") ? mediaUrl(String(r.avatar_url)) : String(r.avatar_url)) : null,
        role: String(r.role), status: String(r.status), emailVerified: Boolean(r.email_verified),
        createdAt: String(r.created_at), videos: Number(r.videos), followers: Number(r.followers), reports: Number(r.reports),
      })),
    });
  });
}
