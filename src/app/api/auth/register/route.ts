import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { safe, ok, readJson, str, rateLimit, clientIp, ApiError, EMAIL_RE, USERNAME_RE } from "@/lib/api";
import { hashPassword, createSession, issueAuthToken, sendMail, publicUser } from "@/lib/auth";

export async function POST(req: Request) {
  return safe(async () => {
    rateLimit(`register:${clientIp(req)}`, 6, 10 * 60_000);
    const body = await readJson(req);
    const email = str(body.email, 200).toLowerCase();
    const username = str(body.username, 24).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const displayName = str(body.displayName, 40) || username;
    const interests = Array.isArray(body.interests)
      ? (body.interests as unknown[]).filter((i): i is string => typeof i === "string").slice(0, 8)
      : [];

    if (!EMAIL_RE.test(email)) throw new ApiError(400, "Enter a valid email address.");
    if (!USERNAME_RE.test(username)) throw new ApiError(400, "Username must be 3–24 characters: letters, numbers, dots or underscores.");
    if (["admin", "vado", "support", "root", "system"].includes(username)) throw new ApiError(400, "That username is reserved.");
    if (password.length < 8) throw new ApiError(400, "Password must be at least 8 characters.");
    if (password.length > 128) throw new ApiError(400, "Password is too long.");

    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(or(eq(users.email, email), sql`lower(${users.username}) = ${username}`))
      .limit(1);
    if (existing.length) throw new ApiError(409, "An account with that email or username already exists.");

    const [user] = await db
      .insert(users)
      .values({ email, username, displayName, passwordHash: await hashPassword(password), interests })
      .returning();

    const token = await issueAuthToken(user.id, "verify_email", 60 * 24);
    const verifyUrl = `/auth/verify?token=${token}`;
    await sendMail(email, "Verify your VADO account", `Welcome to VADO, ${displayName}! Confirm your email to secure your account.`, verifyUrl);
    await createSession(user.id, req.headers.get("user-agent") || "");
    return ok({ user: { ...publicUser(user), email: user.email }, devVerifyUrl: process.env.SMTP_URL ? null : verifyUrl }, 201);
  });
}
