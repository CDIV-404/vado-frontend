"use client";

export class ClientApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T = Record<string, unknown>>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...opts,
    headers: { ...(opts.body ? { "Content-Type": "application/json" } : {}), ...opts.headers },
  });
  let data: Record<string, unknown> = {};
  try {
    data = await res.json();
  } catch {
    /* non-json */
  }
  if (!res.ok) {
    throw new ClientApiError(res.status, (data.error as string) || `Request failed (${res.status})`);
  }
  return data as T;
}

export function post<T = Record<string, unknown>>(path: string, body?: unknown): Promise<T> {
  return api<T>(path, { method: "POST", body: JSON.stringify(body ?? {}) });
}

/** Upload with real progress events (fetch lacks upload progress). */
export function uploadFile(
  file: File | Blob,
  kind: "video" | "avatar" | "cover" | "image",
  onProgress: (pct: number) => void,
  filename = "upload.mp4"
): Promise<{ key: string; url: string; thumbnailKey: string | null; thumbnailUrl: string | null; processed?: boolean }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
      else reject(new ClientApiError(xhr.status, xhr.response?.error || "Upload failed. Try again."));
    };
    xhr.onerror = () => reject(new ClientApiError(0, "Network error during upload. Check your connection."));
    xhr.ontimeout = () => reject(new ClientApiError(0, "Upload timed out. Try a smaller file."));
    xhr.timeout = 5 * 60_000;
    const form = new FormData();
    form.append("file", file, file instanceof File ? file.name : filename);
    form.append("kind", kind);
    xhr.send(form);
  });
}

export function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeLocal(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* full */
  }
}