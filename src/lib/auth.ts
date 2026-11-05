import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/db";
import { users, sessions, authTokens, emailOutbox, type User } from "@/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { ApiError } from "@/lib/api";

const scryptAsync = promisify(scrypt);
export const SESSION_COOKIE = "vado_session";
const SESSION_DAYS = 30;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hash, "hex");
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

function sha256(v: string) {
  return createHash("sha256").update(v).digest("hex");
}

export async function createSession(userId: string, userAgent: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await db.insert(sessions).values({ tokenHash: sha256(token), userId, userAgent: userAgent.slice(0, 300), expiresAt });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.delete(sessions).where(eq(sessions.tokenHash, sha256(token)));
    store.delete(SESSION_COOKIE);
  }
}

/** Current user for this request (deduped per render). Null for guests. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const rows = await db
    .select({ u: users })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha256(token)), gt(sessions.expiresAt, new Date())))
    .limit(1);
  const user = rows[0]?.u ?? null;
  if (user && user.status === "suspended") return null;
  return user;
});

export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "Sign in to do that.");
  return user;
}

export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.role !== "admin") throw new ApiError(403, "Administrator access required.");
  return user;
}

/* ─── One-time tokens (email verification / password reset) ── */

export async function issueAuthToken(userId: string, kind: "verify_email" | "reset_password", ttlMinutes: number) {
  const token = randomBytes(24).toString("hex");
  await db.insert(authTokens).values({
    tokenHash: sha256(token),
    userId,
    kind,
    expiresAt: new Date(Date.now() + ttlMinutes * 60_000),
  });
  return token;
}

export async function consumeAuthToken(token: string, kind: "verify_email" | "reset_password") {
  const rows = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, sha256(token)),
        eq(authTokens.kind, kind),
        gt(authTokens.expiresAt, new Date()),
        isNull(authTokens.usedAt)
      )
    )
    .limit(1);
  const row = rows[0];
  if (!row) throw new ApiError(400, "This link is invalid or has expired. Request a new one.");
  await db.update(authTokens).set({ usedAt: new Date() }).where(eq(authTokens.tokenHash, row.tokenHash));
  return row.userId;
}

/**
 * Mail delivery adapter. With SMTP configured this is where a provider
 * call goes; in this environment mail is persisted to a dev outbox and
 * the action link is surfaced in the UI so flows remain fully usable.
 */
export async function sendMail(toEmail: string, subject: string, body: string, link: string) {
  await db.insert(emailOutbox).values({ toEmail, subject, body, link });
}

export function publicUser(u: User) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    bio: u.bio,
    avatarUrl: u.avatarUrl
      ? u.avatarUrl.startsWith("avatars/")
        ? `/api/media?key=${encodeURIComponent(u.avatarUrl)}`
        : u.avatarUrl
      : null,
    role: u.role,
    emailVerified: u.emailVerified,
    interests: u.interests,
    likedVideosPublic: u.likedVideosPublic,
    desktopNotifications: u.desktopNotifications,
    createdAt: u.createdAt,
  };
}
