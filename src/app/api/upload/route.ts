import { db } from "@/db";
import { mediaAssets } from "@/db/schema";
import { safe, ok, rateLimit, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { saveObject, validateUpload, processVideo, mediaUrl } from "@/lib/storage";

export const maxDuration = 300;

export async function POST(req: Request) {
  return safe(async () => {
    const user = await requireUser();
    rateLimit(`upload:${user.id}`, 30, 60 * 60_000);
    const form = await req.formData();
    const file = form.get("file");
    const kindRaw = String(form.get("kind") || "video");
    if (!(file instanceof File)) throw new ApiError(400, "No file received.");

    if (kindRaw === "video") {
      const ext = await validateUpload(file, "video");
      const buf = Buffer.from(await file.arrayBuffer());
      const key = await saveObject("videos", ext === "mov" ? "mp4" : ext, buf);
      const { thumbnailKey, processed } = await processVideo(key);
      const finalKey = processed ? key.replace(/\.[a-z0-9]+$/i, ".mp4") : key;
      await db.insert(mediaAssets).values({ key: finalKey, userId: user.id, kind: "video", bytes: buf.length });
      if (thumbnailKey) {
        await db.insert(mediaAssets).values({ key: thumbnailKey, userId: user.id, kind: "cover", bytes: 0 });
      }
      return ok({ key: finalKey, url: mediaUrl(finalKey), thumbnailKey, thumbnailUrl: mediaUrl(thumbnailKey), processed }, 201);
    }

    if (kindRaw === "avatar" || kindRaw === "cover" || kindRaw === "image") {
      const ext = await validateUpload(file, "image");
      const buf = Buffer.from(await file.arrayBuffer());
      const folder = kindRaw === "avatar" ? "avatars" : "thumbnails";
      const key = await saveObject(folder, ext, buf);
      await db.insert(mediaAssets).values({ key, userId: user.id, kind: kindRaw === "avatar" ? "image" : "cover", bytes: buf.length });
      return ok({ key, url: mediaUrl(key) }, 201);
    }

    throw new ApiError(400, "Unknown upload kind.");
  });
}
