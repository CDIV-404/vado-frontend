import { db } from "@/db";
import { videos, categories, mediaAssets } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { safe, ok, readJson, str, rateLimit, ApiError, clampInt } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { syncVideoHashtags, getVideoById } from "@/lib/videos";
import { removeObject } from "@/lib/storage";

export async function POST(req: Request) {
  return safe(async () => {
    const user = await requireUser();
    rateLimit(`publish:${user.id}`, 20, 60 * 60_000);
    const body = await readJson(req);
    const videoKey = str(body.videoKey, 120);
    const thumbnailKey = str(body.thumbnailKey, 120) || null;
    const caption = str(body.caption, 2200);
    const visibility = ["public", "followers", "private"].includes(str(body.visibility)) ? str(body.visibility) : "public";
    const status = str(body.status) === "draft" ? "draft" : "published";
    const soundTitle = str(body.soundTitle, 80) || "Original sound";
    const categorySlug = str(body.categorySlug, 40);
    const durationMs = clampInt(body.durationMs, 0, 10 * 60_000, 0);
    const width = clampInt(body.width, 1, 7680, 1080);
    const height = clampInt(body.height, 1, 7680, 1920);
    const sizeBytes = clampInt(body.sizeBytes, 0, 500 * 1024 * 1024, 0);

    if (!videoKey.startsWith("videos/")) throw new ApiError(400, "Upload a video first.");
    const asset = await db.select().from(mediaAssets).where(eq(mediaAssets.key, videoKey)).limit(1);
    if (!asset[0] || asset[0].userId !== user.id) throw new ApiError(403, "This upload does not belong to you.");
    if (asset[0].videoId) throw new ApiError(409, "This upload has already been published.");
    if (thumbnailKey) {
      const cover = await db.select().from(mediaAssets).where(eq(mediaAssets.key, thumbnailKey)).limit(1);
      if (!cover[0] || cover[0].userId !== user.id) throw new ApiError(403, "Invalid cover image.");
    }

    let categoryId: string | null = null;
    if (categorySlug) {
      const cat = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
      categoryId = cat[0]?.id ?? null;
    }

    const [video] = await db
      .insert(videos)
      .values({
        userId: user.id, caption, videoKey, thumbnailKey, visibility, status,
        soundTitle, categoryId, durationMs, width, height, sizeBytes,
      })
      .returning();
    await db.update(mediaAssets).set({ videoId: video.id }).where(eq(mediaAssets.key, videoKey));
    await syncVideoHashtags(video.id, caption);
    const dto = await getVideoById(video.id, user.id);
    return ok({ video: dto }, 201);
  });
}

/** Replace the draft's media (re-upload before publishing). */
export async function DELETE(req: Request) {
  return safe(async () => {
    const user = await requireUser();
    const url = new URL(req.url);
    const key = url.searchParams.get("key") || "";
    if (!key.startsWith("videos/") && !key.startsWith("thumbnails/")) throw new ApiError(400, "Invalid key.");
    const asset = await db.select().from(mediaAssets).where(and(eq(mediaAssets.key, key), eq(mediaAssets.userId, user.id))).limit(1);
    if (asset[0] && !asset[0].videoId) {
      await removeObject(key);
      await db.delete(mediaAssets).where(eq(mediaAssets.key, key));
    }
    return ok({ ok: true });
  });
}