import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { safe, ok, readJson, str, rateLimit, clientIp, ApiError } from "@/lib/api";
import { verifyPassword, createSession, publicUser } from "@/lib/auth";

export async function POST(req: Request) {
  return safe(async () => {
    rateLimit(`login:${clientIp(req)}`, 12, 5 * 60_000);
    const body = await readJson(req);
    const identifier = str(body.identifier, 200).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    if (!identifier || !password) throw new ApiError(400, "Enter your email/username and password.");

    const rows = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), sql`lower(${users.username}) = ${identifier}`))
      .limit(1);
    const user = rows[0];
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new ApiError(401, "Incorrect credentials. Check your email/username and password.");
    }
    if (user.status === "suspended") throw new ApiError(403, "This account is suspended. Contact support@vado.app.");
    await createSession(user.id, req.headers.get("user-agent") || "");
    return ok({ user: { ...publicUser(user), email: user.email } });
  });
}
