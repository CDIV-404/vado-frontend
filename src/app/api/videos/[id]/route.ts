import { db } from "@/db";
import { videos, categories, mediaAssets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { safe, ok, readJson, str, ApiError } from "@/lib/api";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { getVideoById, syncVideoHashtags } from "@/lib/videos";
import { removeObject } from "@/lib/storage";
import { audit } from "@/lib/notify";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { id } = await ctx.params;
    const viewer = await getCurrentUser();
    const video = await getVideoById(id, viewer?.id ?? null);
    if (!video) throw new ApiError(404, "This video is unavailable.");
    return ok({ video });
  });
}

export async function PATCH(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    const rows = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
    const video = rows[0];
    if (!video) throw new ApiError(404, "Video not found.");
    if (video.userId !== user.id) throw new ApiError(403, "You can only edit your own videos.");
    const body = await readJson(req);
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (typeof body.caption === "string") patch.caption = str(body.caption, 2200);
    if (["public", "followers", "private"].includes(str(body.visibility))) patch.visibility = str(body.visibility);
    if (typeof body.soundTitle === "string") patch.soundTitle = str(body.soundTitle, 80) || "Original sound";
    if (body.status === "published" && video.status === "draft") patch.status = "published";
    if (typeof body.categorySlug === "string") {
      const cat = await db.select().from(categories).where(eq(categories.slug, str(body.categorySlug, 40))).limit(1);
      patch.categoryId = cat[0]?.id ?? null;
    }
    await db.update(videos).set(patch).where(eq(videos.id, id));
    if (typeof patch.caption === "string") await syncVideoHashtags(id, patch.caption);
    return ok({ video: await getVideoById(id, user.id) });
  });
}

export async function DELETE(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { id } = await ctx.params;
    const user = await requireUser();
    const rows = await db.select().from(videos).where(eq(videos.id, id)).limit(1);
    const video = rows[0];
    if (!video) throw new ApiError(404, "Video not found.");
    if (video.userId !== user.id && user.role !== "admin") throw new ApiError(403, "You can only delete your own videos.");
    await removeObject(video.videoKey);
    await removeObject(video.thumbnailKey);
    await db.delete(mediaAssets).where(eq(mediaAssets.videoId, id));
    await db.delete(videos).where(eq(videos.id, id));
    if (user.role === "admin" && video.userId !== user.id) {
      await audit(user.id, "remove_video", "video", id, "Removed by moderation");
    }
    return ok({ ok: true });
  });
}
