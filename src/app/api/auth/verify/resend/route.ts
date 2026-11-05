import { safe, ok, rateLimit, ApiError } from "@/lib/api";
import { requireUser, issueAuthToken, sendMail } from "@/lib/auth";

export async function POST() {
  return safe(async () => {
    const user = await requireUser();
    if (user.emailVerified) throw new ApiError(400, "Your email is already verified.");
    rateLimit(`verify-resend:${user.id}`, 3, 10 * 60_000);
    const token = await issueAuthToken(user.id, "verify_email", 60 * 24);
    const link = `/auth/verify?token=${token}`;
    await sendMail(user.email, "Verify your VADO account", "Confirm your email to secure your account.", link);
    return ok({ ok: true, devVerifyUrl: process.env.SMTP_URL ? null : link });
  });
}
