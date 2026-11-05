import { NextResponse } from "next/server";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json(data as object, { status });
}

/** Wrap a handler with uniform error handling + logging. */
export async function safe(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    console.error("[vado:api]", e);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

export async function readJson<T extends Record<string, unknown>>(req: Request): Promise<T> {
  try {
    const data = await req.json();
    if (typeof data !== "object" || data === null) throw new Error();
    return data as T;
  } catch {
    throw new ApiError(400, "Invalid request body.");
  }
}

export function str(v: unknown, max = 2000): string {
  return typeof v === "string" ? v.slice(0, max).trim() : "";
}

/* ─── In-memory sliding-window rate limiter ─────────────────
   Suitable for a single instance; swap for Redis in a scaled
   deployment without changing call sites. */
const buckets = new Map<string, number[]>();
export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    buckets.set(key, arr);
    throw new ApiError(429, "Too many requests — slow down for a moment.");
  }
  arr.push(now);
  buckets.set(key, arr);
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
}

export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const USERNAME_RE = /^[a-zA-Z0-9_.]{3,24}$/;

export function clampInt(v: unknown, min: number, max: number, fallback: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(n)));
}
