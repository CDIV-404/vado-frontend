import { db } from "@/db";
import { notifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { safe, ok } from "@/lib/api";
import { getCurrentUser, publicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return safe(async () => {
    const user = await getCurrentUser();
    if (!user) return ok({ user: null, unread: 0 });
    const unreadRows = await db
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
    return ok({ user: { ...publicUser(user), email: user.email }, unread: unreadRows.length });
  });
}
