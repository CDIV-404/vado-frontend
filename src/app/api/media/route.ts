import { safe } from "@/lib/api";
import { streamObject } from "@/lib/storage";

export async function GET(req: Request) {
  return safe(async () => {
    const key = new URL(req.url).searchParams.get("key") || "";
    return streamObject(key, req.headers.get("range"));
  });
}

export async function HEAD(req: Request) {
  return safe(async () => {
    const key = new URL(req.url).searchParams.get("key") || "";
    const res = await streamObject(key, "bytes=0-0");
    return new Response(null, { status: 200, headers: res.headers });
  });
}
