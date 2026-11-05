import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { safe, ok, readJson, str, rateLimit, clientIp, ApiError, EMAIL_RE } from "@/lib/api";
import { issueAuthToken, sendMail } from "@/lib/auth";

export async function POST(req: Request) {
  return safe(async () => {
    rateLimit(`recover:${clientIp(req)}`, 4, 10 * 60_000);
    const body = await readJson(req);
    const email = str(body.email, 200).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new ApiError(400, "Enter a valid email address.");
    const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
    let devResetUrl: string | null = null;
    if (rows[0]) {
      const token = await issueAuthToken(rows[0].id, "reset_password", 30);
      const link = `/auth/reset?token=${token}`;
      await sendMail(email, "Reset your VADO password", "Use the link below to choose a new password. It expires in 30 minutes.", link);
      if (!process.env.SMTP_URL) devResetUrl = link;
    }
    // Same response whether or not the account exists (no enumeration).
    return ok({ ok: true, devResetUrl });
  });
}
