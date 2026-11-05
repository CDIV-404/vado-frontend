import { db } from "@/db";
import { users, mediaAssets } from "@/db/schema";
import { eq } from "drizzle-orm";
import { safe, ok, readJson, str, ApiError } from "@/lib/api";
import { requireUser, publicUser } from "@/lib/auth";

export async function PATCH(req: Request) {
  return safe(async () => {
    const user = await requireUser();
    const body = await readJson(req);
    const patch: Record<string, unknown> = {};
    if (typeof body.displayName === "string") {
      const name = str(body.displayName, 40);
      if (!name) throw new ApiError(400, "Display name can't be empty.");
      patch.displayName = name;
    }
    if (typeof body.bio === "string") patch.bio = str(body.bio, 200);
    if (Array.isArray(body.interests)) {
      patch.interests = (body.interests as unknown[]).filter((i): i is string => typeof i === "string").slice(0, 8);
    }
    if (typeof body.likedVideosPublic === "boolean") patch.likedVideosPublic = body.likedVideosPublic;
    if (typeof body.desktopNotifications === "boolean") patch.desktopNotifications = body.desktopNotifications;
    if (typeof body.avatarKey === "string" && body.avatarKey.startsWith("avatars/")) {
      const asset = await db.select().from(mediaAssets).where(eq(mediaAssets.key, body.avatarKey)).limit(1);
      if (!asset[0] || asset[0].userId !== user.id) throw new ApiError(403, "Invalid avatar upload.");
      patch.avatarUrl = body.avatarKey;
    }
    if (Object.keys(patch).length === 0) throw new ApiError(400, "Nothing to update.");
    const [updated] = await db.update(users).set(patch).where(eq(users.id, user.id)).returning();
    return ok({ user: { ...publicUser(updated), email: updated.email } });
  });
}
