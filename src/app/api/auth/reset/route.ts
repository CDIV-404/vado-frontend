import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { safe, ok, readJson, str, rateLimit, clientIp, ApiError } from "@/lib/api";
import { consumeAuthToken, hashPassword } from "@/lib/auth";

export async function POST(req: Request) {
  return safe(async () => {
    rateLimit(`reset:${clientIp(req)}`, 8, 10 * 60_000);
    const body = await readJson(req);
    const token = str(body.token, 100);
    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters.");
    const userId = await consumeAuthToken(token, "reset_password");
    await db.update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, userId));
    await db.delete(sessions).where(eq(sessions.userId, userId)); // sign out everywhere
    return ok({ ok: true });
  });
}
