import { safe, ok } from "@/lib/api";
import { destroySession } from "@/lib/auth";

export async function POST() {
  return safe(async () => {
    await destroySession();
    return ok({ ok: true });
  });
}
