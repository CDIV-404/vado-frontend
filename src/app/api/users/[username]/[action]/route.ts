import { db } from "@/db";
import { users, follows, blocks, reports } from "@/db/schema";
import { eq, and, or, sql } from "drizzle-orm";
import { safe, ok, readJson, str, rateLimit, ApiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { notify } from "@/lib/notify";

type Ctx = { params: Promise<{ username: string; action: string }> };

export async function POST(req: Request, ctx: Ctx) {
  return safe(async () => {
    const { username: id, action } = await ctx.params;
    const user = await requireUser();
    rateLimit(`useract:${user.id}`, 60, 60_000);
    if (id === user.id && action !== "report") throw new ApiError(400, "You can't do that to yourself.");
    const target = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!target[0] || target[0].status !== "active") throw new ApiError(404, "Account not found.");

    if (action === "follow") {
      const inserted = await db
        .insert(follows)
        .values({ followerId: user.id, followeeId: id })
        .onConflictDoNothing()
        .returning();
      let active: boolean;
      if (inserted.length) {
        active = true;
        await notify({ userId: id, actorId: user.id, kind: "follow" });
      } else {
        await db.delete(follows).where(and(eq(follows.followerId, user.id), eq(follows.followeeId, id)));
        active = false;
      }
      const r = await db.select({ n: sql<number>`COUNT(*)::int` }).from(follows).where(eq(follows.followeeId, id));
      return ok({ active, followers: r[0]?.n ?? 0 });
    }

    if (action === "block") {
      const inserted = await db
        .insert(blocks)
        .values({ blockerId: user.id, blockedId: id })
        .onConflictDoNothing()
        .returning();
      let active: boolean;
      if (inserted.length) {
        active = true;
        await db.delete(follows).where(
          or(
            and(eq(follows.followerId, user.id), eq(follows.followeeId, id)),
            and(eq(follows.followerId, id), eq(follows.followeeId, user.id))
          )
        );
      } else {
        await db.delete(blocks).where(and(eq(blocks.blockerId, user.id), eq(blocks.blockedId, id)));
        active = false;
      }
      return ok({ active });
    }

    if (action === "report") {
      rateLimit(`report:${user.id}`, 10, 60 * 60_000);
      const body = await readJson(req);
      const reason = str(body.reason, 80);
      if (!reason) throw new ApiError(400, "Choose a reason for the report.");
      await db.insert(reports).values({
        reporterId: user.id, targetType: "user", targetId: id, reason, details: str(body.details, 1000),
      });
      return ok({ ok: true }, 201);
    }

    throw new ApiError(404, "Unknown action.");
  });
}
