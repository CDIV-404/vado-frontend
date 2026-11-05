import { db } from "@/db";
import { sessions } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { createHash } from "node:crypto";
import { safe, ok, readJson, str, ApiError } from "@/lib/api";
import { requireUser, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return safe(async () => {
    const user = await requireUser();
    const store = await cookies();
    const current = store.get(SESSION_COOKIE)?.value;
    const currentHash = current ? createHash("sha256").update(current).digest("hex") : "";
    const rows = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, user.id))
      .orderBy(desc(sessions.createdAt))
      .limit(20);
    return ok({
      sessions: rows.map((s) => ({
        id: s.tokenHash,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        current: s.tokenHash === currentHash,
      })),
    });
  });
}

export async function DELETE(req: Request) {
  return safe(async () => {
    const user = await requireUser();
    const body = await readJson(req);
    const id = str(body.id, 80);
    if (!/^[a-f0-9]{64}$/.test(id)) throw new ApiError(400, "Invalid session.");
    await db.delete(sessions).where(and(eq(sessions.userId, user.id), eq(sessions.tokenHash, id)));
    const store = await cookies();
    const current = store.get(SESSION_COOKIE)?.value;
    if (current && createHash("sha256").update(current).digest("hex") === id) store.delete(SESSION_COOKIE);
    return ok({ ok: true });
  });
}
