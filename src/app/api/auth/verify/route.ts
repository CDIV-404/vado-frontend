import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { safe, ok, readJson, str } from "@/lib/api";
import { consumeAuthToken } from "@/lib/auth";

export async function POST(req: Request) {
  return safe(async () => {
    const body = await readJson(req);
    const userId = await consumeAuthToken(str(body.token, 100), "verify_email");
    await db.update(users).set({ emailVerified: true }).where(eq(users.id, userId));
    return ok({ ok: true });
  });
}
