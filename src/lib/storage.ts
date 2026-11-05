import { promises as fs } from "node:fs";
import { createReadStream } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { ApiError } from "@/lib/api";

const execFileAsync = promisify(execFile);

/**
 * Object-storage adapter. Files live outside the relational database in
 * STORAGE_DIR (default ./storage) and are delivered through /api/media
 * with HTTP Range support. The interface (save / remove / stream) maps
 * 1:1 onto S3-compatible storage for production deployments.
 */
export const STORAGE_DIR = process.env.STORAGE_DIR || path.join(process.cwd(), "storage");

const MIME: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
};

export const VIDEO_EXTS = ["mp4", "webm", "mov", "m4v"];
export const IMAGE_EXTS = ["jpg", "jpeg", "png", "webp", "gif"];
export const MAX_VIDEO_BYTES = Number(process.env.MAX_VIDEO_BYTES || 150 * 1024 * 1024);
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function resolveKey(key: string): string {
  if (!/^[a-zA-Z0-9/_.-]+$/.test(key) || key.includes("..")) {
    throw new ApiError(400, "Invalid media key.");
  }
  const full = path.join(STORAGE_DIR, key);
  if (!full.startsWith(STORAGE_DIR)) throw new ApiError(400, "Invalid media key.");
  return full;
}

export async function saveObject(folder: string, ext: string, data: Buffer): Promise<string> {
  const key = `${folder}/${randomUUID()}.${ext}`;
  const full = resolveKey(key);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, data);
  return key;
}

export async function removeObject(key: string | null | undefined) {
  if (!key) return;
  try {
    await fs.unlink(resolveKey(key));
  } catch {
    /* already gone */
  }
}

export function mediaUrl(key: string | null | undefined): string | null {
  return key ? `/api/media?key=${encodeURIComponent(key)}` : null;
}

export function extOf(filename: string): string {
  return (filename.split(".").pop() || "").toLowerCase();
}

/** Stream an object with Range support for smooth video seeking. */
export async function streamObject(key: string, rangeHeader: string | null): Promise<Response> {
  const full = resolveKey(key);
  let stat;
  try {
    stat = await fs.stat(full);
  } catch {
    throw new ApiError(404, "Media not found.");
  }
  const type = MIME[extOf(key)] || "application/octet-stream";
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  if (rangeHeader) {
    const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(parseInt(m[2], 10), stat.size - 1) : stat.size - 1;
      if (start <= end && start < stat.size) {
        headers["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
        headers["Content-Length"] = String(end - start + 1);
        const node = createReadStream(full, { start, end });
        return new Response(Readable.toWeb(node) as ReadableStream, { status: 206, headers });
      }
    }
  }
  headers["Content-Length"] = String(stat.size);
  const node = createReadStream(full);
  return new Response(Readable.toWeb(node) as ReadableStream, { status: 200, headers });
}

/* ─── Video processing ────────────────────────────────────────
   When ffmpeg is present, uploads are normalized to H.264 MP4
   (faststart, ≤720p) and a poster frame is extracted server-side.
   Without ffmpeg the original browser-compatible file is kept and
   the client-extracted cover frame is used — playback still works. */

let ffmpegAvailable: boolean | null = null;
export async function hasFfmpeg(): Promise<boolean> {
  if (ffmpegAvailable !== null) return ffmpegAvailable;
  try {
    await execFileAsync("ffmpeg", ["-version"]);
    ffmpegAvailable = true;
  } catch {
    ffmpegAvailable = false;
  }
  return ffmpegAvailable;
}

export async function processVideo(key: string): Promise<{ thumbnailKey: string | null; processed: boolean }> {
  if (!(await hasFfmpeg())) return { thumbnailKey: null, processed: false };
  const input = resolveKey(key);
  try {
    const outKey = key.replace(/\.[a-z0-9]+$/i, ".mp4");
    const output = resolveKey(outKey);
    await execFileAsync("ffmpeg", [
      "-y", "-i", input,
      "-vf", "scale='min(720,iw)':-2",
      "-c:v", "libx264", "-preset", "veryfast", "-crf", "26",
      "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart",
      output,
    ], { timeout: 120_000 });
    if (output !== input) await fs.unlink(input).catch(() => {});
    const thumbData = await fs.readFile(input).catch(() => null);
    void thumbData;
    const thumbKey = `thumbnails/${randomUUID()}.jpg`;
    await execFileAsync("ffmpeg", [
      "-y", "-i", output, "-ss", "0.5", "-vframes", "1", "-vf", "scale=540:-2",
      resolveKey(thumbKey),
    ], { timeout: 30_000 });
    return { thumbnailKey: thumbKey, processed: true };
  } catch (e) {
    console.error("[vado:process]", e);
    return { thumbnailKey: null, processed: false };
  }
}

export async function validateUpload(file: File, kind: "video" | "image") {
  const ext = extOf(file.name);
  const exts = kind === "video" ? VIDEO_EXTS : IMAGE_EXTS;
  const max = kind === "video" ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  if (!exts.includes(ext)) {
    throw new ApiError(415, `Unsupported ${kind} format. Allowed: ${exts.join(", ")}.`);
  }
  if (file.size === 0) throw new ApiError(400, "The file is empty.");
  if (file.size > max) {
    throw new ApiError(413, `File is too large (max ${Math.round(max / 1024 / 1024)} MB).`);
  }
  return ext;
}