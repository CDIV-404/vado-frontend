import { db } from "@/db";
import { comments, videos, reports } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { safe, ok, readJson, str, rateLimit, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { audit } from "@/lib/notify";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    const rows = await db
      .select({ c: comments, v: videos })
      .from(comments)
      .innerJoin(videos, eq(videos.id, comments.videoId))
      .where(eq(comments.id, id))
      .limit(1);
    const row = rows[0];
    if (!row) throw new ApiError(404, "Comment not found.");
    const allowed = row.c.userId === user.id || row.v.userId === user.id || user.role === "admin";
    if (!allowed) throw new ApiError(403, "You can't delete this comment.");
    await db
      .update(comments)
      .set({ status: "removed" })
      .where(or(eq(comments.id, id), eq(comments.parentId, id)));
    if (user.role === "admin" && row.c.userId !== user.id) {
      await audit(user.id, "remove_comment", "comment", id, "Removed by moderation");
    }
    return ok({ ok: true });
  });
}

export async function POST(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    rateLimit(`report:${user.id}`, 10, 60 * 60_000);
    const body = await readJson(req);
    const reason = str(body.reason, 80);
    if (!reason) throw new ApiError(400, "Choose a reason for the report.");
    const exists = await db.select({ id: comments.id }).from(comments).where(eq(comments.id, id)).limit(1);
    if (!exists[0]) throw new ApiError(404, "Comment not found.");
    await db.insert(reports).values({
      reporterId: user.id, targetType: "comment", targetId: id, reason, details: str(body.details, 1000),
    });
    return ok({ ok: true }, 201);
  });
}
