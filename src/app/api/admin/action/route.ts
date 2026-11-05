import { db } from "@/db";
import { users, videos, comments, reports, sessions, auditLogs } from "@/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { safe, ok, readJson, str, ApiError } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { audit, notify } from "@/lib/notify";

export async function GET() {
  return safe(async () => {
    await requireAdmin();
    const rows = await db
      .select({ l: auditLogs, a: users })
      .from(auditLogs)
      .innerJoin(users, eq(users.id, auditLogs.adminId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(80);
    return ok({
      logs: rows.map(({ l, a }) => ({
        id: l.id, action: l.action, targetType: l.targetType, targetId: l.targetId,
        details: l.details, createdAt: l.createdAt, admin: a.username,
      })),
    });
  });
}

export async function POST(req: Request) {
  return safe(async () => {
    const admin = await requireAdmin();
    const body = await readJson(req);
    const type = str(body.type, 40);
    const targetId = str(body.targetId, 40);
    const reportId = str(body.reportId, 40) || null;
    const reason = str(body.reason, 300) || "Moderation action";

    const resolveReport = async (resolution: string) => {
      if (!reportId) return;
      await db
        .update(reports)
        .set({ status: resolution === "dismissed" ? "dismissed" : "resolved", resolution, resolvedBy: admin.id, resolvedAt: new Date() })
        .where(eq(reports.id, reportId));
    };

    if (type === "suspend" || type === "restore") {
      const target = await db.select().from(users).where(eq(users.id, targetId)).limit(1);
      if (!target[0]) throw new ApiError(404, "User not found.");
      if (target[0].role === "admin") throw new ApiError(403, "Administrators cannot be suspended.");
      await db.update(users).set({ status: type === "suspend" ? "suspended" : "active" }).where(eq(users.id, targetId));
      if (type === "suspend") await db.delete(sessions).where(eq(sessions.userId, targetId));
      await audit(admin.id, type, "user", targetId, reason);
      await resolveReport(type === "suspend" ? "Account suspended" : "Account restored");
      return ok({ ok: true });
    }

    if (type === "remove_video") {
      const v = await db.select().from(videos).where(eq(videos.id, targetId)).limit(1);
      if (!v[0]) throw new ApiError(404, "Video not found.");
      await db.update(videos).set({ status: "removed" }).where(eq(videos.id, targetId));
      await notify({ userId: v[0].userId, kind: "system", body: `Your video was removed by moderation: ${reason}` });
      await audit(admin.id, "remove_video", "video", targetId, reason);
      await resolveReport("Video removed");
      return ok({ ok: true });
    }

    if (type === "restore_video") {
      await db.update(videos).set({ status: "published" }).where(eq(videos.id, targetId));
      await audit(admin.id, "restore_video", "video", targetId, reason);
      await resolveReport("Video restored");
      return ok({ ok: true });
    }

    if (type === "remove_comment") {
      await db.update(comments).set({ status: "removed" }).where(or(eq(comments.id, targetId), eq(comments.parentId, targetId)));
      await audit(admin.id, "remove_comment", "comment", targetId, reason);
      await resolveReport("Comment removed");
      return ok({ ok: true });
    }

    if (type === "dismiss_report") {
      if (!reportId) throw new ApiError(400, "Missing report.");
      await resolveReport("dismissed");
      await audit(admin.id, "dismiss_report", "report", reportId, reason);
      return ok({ ok: true });
    }

    throw new ApiError(400, "Unknown moderation action.");
  });
}
