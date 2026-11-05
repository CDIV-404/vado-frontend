import { db } from "@/db";
import { sql } from "drizzle-orm";
import { safe, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { mediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return safe(async () => {
    await requireAdmin();
    const status = new URL(req.url).searchParams.get("status") || "open";
    const rows = await db.execute(sql`
      SELECT r.*, ru.username AS reporter_name,
        CASE r.target_type
          WHEN 'video' THEN (SELECT v.caption FROM videos v WHERE v.id = r.target_id)
          WHEN 'comment' THEN (SELECT c.body FROM comments c WHERE c.id = r.target_id)
          WHEN 'user' THEN (SELECT '@' || u.username FROM users u WHERE u.id = r.target_id)
        END AS target_preview,
        CASE r.target_type
          WHEN 'video' THEN (SELECT v.thumbnail_key FROM videos v WHERE v.id = r.target_id)
          ELSE NULL
        END AS target_thumb,
        CASE r.target_type
          WHEN 'video' THEN (SELECT v.user_id FROM videos v WHERE v.id = r.target_id)
          WHEN 'comment' THEN (SELECT c.user_id FROM comments c WHERE c.id = r.target_id)
          WHEN 'user' THEN r.target_id
        END AS owner_id
      FROM reports r JOIN users ru ON ru.id = r.reporter_id
      WHERE r.status = ${status}
      ORDER BY r.created_at DESC LIMIT 100
    `);
    return ok({
      reports: (rows.rows as Record<string, unknown>[]).map((r) => ({
        id: String(r.id), targetType: String(r.target_type), targetId: String(r.target_id),
        reason: String(r.reason), details: String(r.details ?? ""), status: String(r.status),
        resolution: String(r.resolution ?? ""), createdAt: String(r.created_at),
        reporterName: String(r.reporter_name), targetPreview: r.target_preview ? String(r.target_preview) : "(deleted)",
        targetThumb: mediaUrl(r.target_thumb ? String(r.target_thumb) : null),
        ownerId: r.owner_id ? String(r.owner_id) : null,
      })),
    });
  });
}
