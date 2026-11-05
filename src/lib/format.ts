export function formatCount(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, "")}K`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
}

export function timeAgo(iso: string | Date): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const CATEGORY_LIST = [
  { slug: "urban", name: "Urban & Night", hue: "#287CFF" },
  { slug: "nature", name: "Nature & Ocean", hue: "#38C9FF" },
  { slug: "dance", name: "Dance & Movement", hue: "#8057FF" },
  { slug: "food", name: "Food & Craft", hue: "#FF7A59" },
  { slug: "tech", name: "Tech & Futurism", hue: "#4DE3B4" },
  { slug: "art", name: "Art & Visuals", hue: "#FF5CA8" },
  { slug: "travel", name: "Travel & Places", hue: "#FFC24B" },
  { slug: "lifestyle", name: "Lifestyle", hue: "#9D7BFF" },
] as const;

export function avatarGradient(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hues = [217, 258, 195, 280, 230, 205];
  const a = hues[h % hues.length];
  const b = hues[(h >> 3) % hues.length];
  return `linear-gradient(135deg, hsl(${a} 90% 58%), hsl(${b} 85% 48%))`;
}