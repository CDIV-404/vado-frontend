"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Compass, VideoOff, Hash, ArrowLeft, UserPlus, RefreshCw, Volume2, VolumeX, Upload } from "lucide-react";
import { useApp } from "@/components/providers";
import { Spinner, EmptyState } from "@/components/ui";
import { api } from "@/lib/client";
import type { VideoDTO } from "@/lib/types";
import { VideoCard } from "./VideoCard";
import { CommentsPanel } from "./CommentsPanel";
import { ShareSheet } from "./ShareSheet";

type FeedResp = { videos: VideoDTO[]; hasMore: boolean };

export function Feed({
  mode = "home",
  filter,
  initialVideo,
}: {
  mode?: "home" | "hashtag" | "category" | "single";
  filter?: string;
  initialVideo?: VideoDTO;
}) {
  const { user, ready, muted, setMuted, promptAuth } = useApp();
  const router = useRouter();
  const [tab, setTab] = useState<"foryou" | "following">("foryou");
  const [videos, setVideos] = useState<VideoDTO[]>(initialVideo ? [initialVideo] : []);
  const [activeId, setActiveId] = useState<string | null>(initialVideo?.id ?? null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentsFor, setCommentsFor] = useState<VideoDTO | null>(null);
  const [shareFor, setShareFor] = useState<VideoDTO | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef(new Map<string, HTMLElement>());
  const offsetRef = useRef(0);
  const busyRef = useRef(false);

  const feedUrl = useCallback(
    (offset: number) => {
      if (mode === "hashtag") return `/api/feed?hashtag=${encodeURIComponent(filter ?? "")}&offset=${offset}&limit=6`;
      if (mode === "category") return `/api/feed?category=${encodeURIComponent(filter ?? "")}&offset=${offset}&limit=6`;
      if (mode === "single") return `/api/feed?tab=foryou&offset=${offset}&limit=6`;
      return `/api/feed?tab=${tab}&offset=${offset}&limit=6`;
    },
    [mode, filter, tab]
  );

  const loadInitial = useCallback(async () => {
    if (mode === "home" && tab === "following" && !user) {
      setVideos([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    busyRef.current = true;
    try {
      const data = await api<FeedResp>(feedUrl(0));
      let list = data.videos;
      if (initialVideo) list = [initialVideo, ...list.filter((v) => v.id !== initialVideo.id)];
      setVideos(list);
      offsetRef.current = data.videos.length;
      setHasMore(data.hasMore);
      setActiveId((prev) => (prev && list.some((v) => v.id === prev) ? prev : (list[0]?.id ?? null)));
      containerRef.current?.scrollTo({ top: 0 });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load the feed");
    } finally {
      setLoading(false);
      busyRef.current = false;
    }
  }, [feedUrl, user, mode, tab, initialVideo]);

  useEffect(() => {
    if (ready) void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, tab, mode, filter, user?.id]);

  const loadMore = useCallback(async () => {
    if (busyRef.current || !hasMore) return;
    busyRef.current = true;
    setLoadingMore(true);
    try {
      const data = await api<FeedResp>(feedUrl(offsetRef.current));
      setVideos((prev) => {
        const seen = new Set(prev.map((v) => v.id));
        return [...prev, ...data.videos.filter((v) => !seen.has(v.id))];
      });
      offsetRef.current += data.videos.length;
      setHasMore(data.hasMore && data.videos.length > 0);
    } catch {
      /* silent — retry on next scroll */
    } finally {
      busyRef.current = false;
      setLoadingMore(false);
    }
  }, [feedUrl, hasMore]);

  /* Active slide detection */
  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.55) {
            const id = (entry.target as HTMLElement).dataset.vid ?? null;
            if (id) setActiveId(id);
          }
        }
      },
      { root, threshold: [0.55] }
    );
    for (const el of slideRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [videos]);

  /* Prefetch next page near the end */
  const activeIndex = videos.findIndex((v) => v.id === activeId);
  useEffect(() => {
    if (videos.length > 0 && activeIndex >= videos.length - 2 && hasMore && !loading) void loadMore();
  }, [activeIndex, videos.length, hasMore, loading, loadMore]);

  /* Keyboard navigation */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const idx = videos.findIndex((v) => v.id === activeId);
      const next = e.key === "ArrowDown" ? idx + 1 : idx - 1;
      if (next >= 0 && next < videos.length) {
        slideRefs.current.get(videos[next].id)?.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [videos, activeId]);

  const updateVideo = useCallback((id: string, fn: (v: VideoDTO) => VideoDTO) => {
    setVideos((prev) => {
      const target = prev.find((v) => v.id === id);
      if (!target) return prev;
      const updated = fn(target);
      const followChanged = updated.viewer.followingAuthor !== target.viewer.followingAuthor;
      return prev.map((v) => {
        if (v.id === id) return updated;
        if (followChanged && v.author.id === target.author.id) {
          return { ...v, viewer: { ...v.viewer, followingAuthor: updated.viewer.followingAuthor } };
        }
        return v;
      });
    });
  }, []);

  const applyCount = useCallback((key: "comments" | "shares", id: string, count: number) => {
    setVideos((prev) => {
      const target = prev.find((v) => v.id === id);
      if (!target || target.counts[key] === count) return prev;
      return prev.map((v) => (v.id === id ? { ...v, counts: { ...v.counts, [key]: count } } : v));
    });
  }, []);
  const onCommentCount = useCallback((id: string, count: number) => applyCount("comments", id, count), [applyCount]);
  const onShareCount = useCallback((id: string, count: number) => applyCount("shares", id, count), [applyCount]);

  const removeVideo = useCallback(
    (id: string) => {
      setVideos((prev) => {
        const idx = prev.findIndex((v) => v.id === id);
        const next = prev.filter((v) => v.id !== id);
        if (activeId === id && next.length) {
          setActiveId(next[Math.min(idx, next.length - 1)].id);
        }
        return next;
      });
      if (mode === "single") router.push("/feed");
    },
    [activeId, mode, router]
  );

  const guestFollowing = mode === "home" && tab === "following" && !user;

  return (
    <div className="relative h-dvh">
      {/* Top control bar */}
      <div className="absolute top-0 inset-x-0 z-40 flex items-center justify-center pt-[max(12px,env(safe-area-inset-top))] px-4 pointer-events-none">
        <div className="flex items-center gap-2 w-full max-w-xl justify-center relative">
          {mode !== "home" && (
            <button
              onClick={() => router.back()}
              className="pointer-events-auto absolute left-0 glass-deep w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15 transition"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          {mode === "home" ? (
            <div className="pointer-events-auto glass-deep rounded-full p-1 flex items-center gap-1">
              {(["foryou", "following"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    if (t === "following" && !user) return promptAuth("Sign in to see creators you follow");
                    setTab(t);
                  }}
                  className={`relative px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors ${
                    tab === t ? "text-white" : "text-vado-sub hover:text-vado-text"
                  }`}
                >
                  {tab === t && (
                    <motion.span
                      layoutId="feed-tab"
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-vado-blue/70 to-vado-purple/70 shadow-[0_0_16px_rgba(64,106,255,0.5)]"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <span className="relative">{t === "foryou" ? "For You" : "Following"}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="pointer-events-auto glass-deep rounded-full px-4 py-2 flex items-center gap-1.5 text-sm font-bold">
              <Hash size={14} className="text-vado-cyan" />
              {filter}
            </div>
          )}
          <button
            onClick={() => setMuted(!muted)}
            className="pointer-events-auto absolute right-0 glass-deep w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15 transition"
            aria-label={muted ? "Unmute all" : "Mute all"}
          >
            {muted ? <VolumeX size={15} className="text-vado-sub" /> : <Volume2 size={15} className="text-vado-cyan" />}
          </button>
        </div>
      </div>

      {/* Feed body */}
      {loading ? (
        <div className="h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-40 h-72 rounded-3xl shimmer border border-white/10" />
            <Spinner size={24} />
          </div>
        </div>
      ) : error ? (
        <div className="h-full flex items-center justify-center px-6">
          <EmptyState
            icon={VideoOff}
            title="Feed unavailable"
            sub={error}
            action={
              <button onClick={() => void loadInitial()} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw size={14} /> Try again
              </button>
            }
          />
        </div>
      ) : guestFollowing ? (
        <div className="h-full flex items-center justify-center px-6">
          <EmptyState
            icon={UserPlus}
            title="Follow your first creators"
            sub="Sign in to build a feed of the people you love watching."
            action={
              <button onClick={() => promptAuth()} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white">
                Sign in to VADO
              </button>
            }
          />
        </div>
      ) : videos.length === 0 ? (
        <div className="h-full flex items-center justify-center px-6">
          <EmptyState
            icon={mode === "home" && tab === "following" ? UserPlus : VideoOff}
            title={mode === "home" && tab === "following" ? "Your Following feed is quiet" : "No videos here yet"}
            sub={
              mode === "home" && tab === "following"
                ? "Follow a few creators and their latest drops will land here."
                : "Be the first to light up this corner of VADO."
            }
            action={
              <div className="flex gap-2">
                <Link href="/discover" className="glass-soft rounded-xl px-4 py-2.5 text-sm font-bold flex items-center gap-2 hover:bg-white/10 transition">
                  <Compass size={15} className="text-vado-cyan" /> Discover
                </Link>
                <Link href="/create" className="btn-primary rounded-xl px-4 py-2.5 text-sm font-bold text-white flex items-center gap-2">
                  <Upload size={15} /> Upload
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <div ref={containerRef} className="h-full overflow-y-scroll feed-snap no-scrollbar">
          {videos.map((v, i) => (
            <section
              key={v.id}
              data-vid={v.id}
              ref={(el) => {
                if (el) slideRefs.current.set(v.id, el);
                else slideRefs.current.delete(v.id);
              }}
              className="h-full w-full md:px-4"
            >
              <VideoCard
                video={v}
                active={v.id === activeId}
                near={Math.abs(i - activeIndex) <= 1}
                onUpdate={updateVideo}
                onDeleted={removeVideo}
                onOpenComments={setCommentsFor}
                onOpenShare={setShareFor}
              />
            </section>
          ))}
          {loadingMore && (
            <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none">
              <Spinner size={20} />
            </div>
          )}
        </div>
      )}

      <CommentsPanel
        video={commentsFor ? (videos.find((v) => v.id === commentsFor.id) ?? commentsFor) : null}
        open={!!commentsFor}
        onClose={() => setCommentsFor(null)}
        onCountChange={onCommentCount}
      />
      <ShareSheet
        video={shareFor}
        open={!!shareFor}
        onClose={() => setShareFor(null)}
        onShared={onShareCount}
      />
    </div>
  );
}
