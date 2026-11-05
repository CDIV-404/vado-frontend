import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq, desc, and, ne } from "drizzle-orm";
import { safe, ok } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { mediaUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function GET() {
  return safe(async () => {
    const user = await requireUser();
    const drafts = await db
      .select()
      .from(videos)
      .where(and(eq(videos.userId, user.id), eq(videos.status, "draft"), ne(videos.status, "removed")))
      .orderBy(desc(videos.updatedAt))
      .limit(24);
    return ok({
      drafts: drafts.map((d) => ({
        id: d.id,
        caption: d.caption,
        videoUrl: mediaUrl(d.videoKey),
        thumbnailUrl: mediaUrl(d.thumbnailKey),
        durationMs: d.durationMs,
        visibility: d.visibility,
        soundTitle: d.soundTitle,
        updatedAt: d.updatedAt,
      })),
    });
  });
}