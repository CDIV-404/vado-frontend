import { db } from "@/db";
import { notifications, auditLogs, users } from "@/db/schema";
import { inArray } from "drizzle-orm";

type NotifyInput = {
  userId: string;
  actorId?: string | null;
  kind: "like" | "comment" | "reply" | "follow" | "mention" | "message" | "system";
  videoId?: string | null;
  commentId?: string | null;
  conversationId?: string | null;
  body?: string;
};

/** Persist a real notification. Self-actions never notify. */
export async function notify(input: NotifyInput) {
  if (input.actorId && input.actorId === input.userId) return;
  await db.insert(notifications).values({
    userId: input.userId,
    actorId: input.actorId ?? null,
    kind: input.kind,
    videoId: input.videoId ?? null,
    commentId: input.commentId ?? null,
    conversationId: input.conversationId ?? null,
    body: input.body ?? "",
  });
}

/** Extract @mentions and notify the mentioned accounts (max 5). */
export async function notifyMentions(
  body: string,
  actorId: string,
  videoId: string | null,
  commentId: string | null,
  excludeUserId?: string
) {
  const names = [...new Set((body.match(/@([a-zA-Z0-9_.]{3,24})/g) || []).map((m) => m.slice(1).toLowerCase()))].slice(0, 5);
  if (names.length === 0) return;
  const found = await db.select({ id: users.id, username: users.username }).from(users).where(inArray(users.username, names));
  for (const u of found) {
    if (u.id === excludeUserId) continue;
    await notify({ userId: u.id, actorId, kind: "mention", videoId, commentId, body: body.slice(0, 140) });
  }
}

export async function audit(adminId: string, action: string, targetType: string, targetId: string | null, details = "") {
  await db.insert(auditLogs).values({ adminId, action, targetType, targetId, details });
}