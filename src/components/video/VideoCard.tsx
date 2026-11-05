"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Heart, MessageCircle, Bookmark, Share2, Repeat2, Play, Volume2, VolumeX,
  Music2, MoreHorizontal, Flag, Trash2, Link2, Plus, Check, Lock, Users, Loader2,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { Avatar, Modal } from "@/components/ui";
import { api, post } from "@/lib/client";
import { formatCount } from "@/lib/format";
import type { VideoDTO } from "@/lib/types";
import { ReportModal } from "./ReportModal";

type Updater = (v: VideoDTO) => VideoDTO;

/* ── Action rail ────────────────────────────────────────── */

function RailButton({
  icon, label, active, activeColor, onClick, burst,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  activeColor?: string;
  onClick: () => void;
  burst?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        whileTap={{ scale: 0.82 }}
        onClick={onClick}
        className="glass-deep w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center transition-colors"
        style={active ? { color: activeColor, borderColor: `${activeColor}55` } : undefined}
        aria-label={label}
      >
        <motion.span key={String(active)} initial={burst ? { scale: 0.5 } : false} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 500, damping: 18 }}>
          {icon}
        </motion.span>
      </motion.button>
      <span className="text-[11px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">{label}</span>
    </div>
  );
}

/* ── Video card ─────────────────────────────────────────── */

export function VideoCard({
  video, active, near, onUpdate, onDeleted, onOpenComments, onOpenShare,
}: {
  video: VideoDTO;
  active: boolean;
  near: boolean;
  onUpdate: (id: string, fn: Updater) => void;
  onDeleted: (id: string) => void;
  onOpenComments: (v: VideoDTO) => void;
  onOpenShare: (v: VideoDTO) => void;
}) {
  const { user, muted, setMuted, toast, promptAuth } = useApp();
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>([]);
  const [followJustNow, setFollowJustNow] = useState(false);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const heartId = useRef(0);
  const watch = useRef({ ms: 0, completed: false });
  const stateRef = useRef({ videoId: video.id, isAuthed: !!user });
  stateRef.current = { videoId: video.id, isAuthed: !!user };

  /* Playback lifecycle */
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active) {
      setPlaying(true);
      const p = v.play();
      if (p) p.catch(() => setPlaying(false));
    } else {
      v.pause();
      v.currentTime = 0;
      setProgress(0);
    }
  }, [active]);

  useEffect(() => {
    if (ref.current) ref.current.muted = muted;
  }, [muted]);

  /* Watch-time tracking → recommendations */
  useEffect(() => {
    if (!active || !playing) return;
    const t = setInterval(() => {
      if (!document.hidden) watch.current.ms += 500;
    }, 500);
    return () => clearInterval(t);
  }, [active, playing]);

  const flushWatch = useCallback(() => {
    const { videoId, isAuthed } = stateRef.current;
    const { ms, completed } = watch.current;
    if (ms < 500) return;
    watch.current = { ms: 0, completed: false };
    const payload = JSON.stringify({ watchedMs: ms, durationMs: (ref.current?.duration ?? 0) * 1000, completed });
    fetch(`/api/videos/${videoId}/view`, {
      method: isAuthed ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!active) flushWatch();
  }, [active, flushWatch]);
  useEffect(() => () => flushWatch(), [flushWatch]);

  const togglePlay = useCallback(() => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      void v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);

  /* Interactions */
  const toggleAction = useCallback(
    async (kind: "like" | "save" | "repost", likeOnly = false) => {
      if (!user) return promptAuth(`Sign in to ${kind} videos`);
      const flag = kind === "like" ? "liked" : kind === "save" ? "saved" : "reposted";
      const countKey = kind === "like" ? "likes" : kind === "save" ? "saves" : "reposts";
      const current = video.viewer[flag];
      if (likeOnly && current) return;
      onUpdate(video.id, (v) => ({
        ...v,
        viewer: { ...v.viewer, [flag]: !current },
        counts: { ...v.counts, [countKey]: Math.max(0, v.counts[countKey] + (current ? -1 : 1)) },
      }));
      try {
        const r = await post<{ active: boolean; count: number }>(`/api/videos/${video.id}/${kind}`);
        onUpdate(video.id, (v) => ({
          ...v,
          viewer: { ...v.viewer, [flag]: r.active },
          counts: { ...v.counts, [countKey]: r.count },
        }));
        if (kind === "repost" && r.active) toast("Reposted to your profile", "success");
        if (kind === "save") toast(r.active ? "Added to Saved" : "Removed from Saved", "success");
      } catch (e) {
        onUpdate(video.id, (v) => ({
          ...v,
          viewer: { ...v.viewer, [flag]: current },
          counts: { ...v.counts, [countKey]: v.counts[countKey] + (current ? 1 : -1) },
        }));
        toast(e instanceof Error ? e.message : "Action failed", "error");
      }
    },
    [user, video, onUpdate, promptAuth, toast]
  );

  const follow = useCallback(async () => {
    if (!user) return promptAuth("Sign in to follow creators");
    const current = video.viewer.followingAuthor;
    onUpdate(video.id, (v) => ({ ...v, viewer: { ...v.viewer, followingAuthor: !current } }));
    try {
      await post(`/api/users/${video.author.id}/follow`);
      if (!current) {
        setFollowJustNow(true);
        setTimeout(() => setFollowJustNow(false), 1400);
        toast(`Following ${video.author.displayName}`, "success");
      }
    } catch (e) {
      onUpdate(video.id, (v) => ({ ...v, viewer: { ...v.viewer, followingAuthor: current } }));
      toast(e instanceof Error ? e.message : "Couldn't follow", "error");
    }
  }, [user, video, onUpdate, promptAuth, toast]);

  const burstHeart = (x: number, y: number) => {
    const id = ++heartId.current;
    setHearts((h) => [...h, { id, x, y }]);
    setTimeout(() => setHearts((h) => h.filter((p) => p.id !== id)), 900);
  };

  const onSurfaceClick = (e: React.MouseEvent) => {
    if (e.detail >= 2) return;
    if (tapTimer.current) clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => togglePlay(), 240);
  };
  const onSurfaceDouble = (e: React.MouseEvent) => {
    if (tapTimer.current) clearTimeout(tapTimer.current);
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    burstHeart(e.clientX - rect.left, e.clientY - rect.top);
    void toggleAction("like", true);
  };

  /* Keyboard control on the active card */
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "m" || e.key === "M") {
        setMuted(!muted);
      } else if (e.key === "l" || e.key === "L") {
        void toggleAction("like", true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, muted, setMuted, togglePlay, toggleAction]);

  const deleteVideo = async () => {
    try {
      await api(`/api/videos/${video.id}`, { method: "DELETE" });
      toast("Video deleted", "success");
      setConfirmDelete(false);
      onDeleted(video.id);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't delete", "error");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/video/${video.id}`);
      toast("Link copied", "success");
    } catch {
      toast("Couldn't copy link", "warn");
    }
    setMenuOpen(false);
  };

  const isOwn = user?.id === video.author.id;
  const captionLong = video.caption.length > 92;

  const rail = (
    <div className="flex flex-col items-center gap-3.5 md:gap-4">
      <div className="relative mb-1">
        <Link href={`/profile/${video.author.username}`} aria-label={video.author.displayName}>
          <Avatar src={video.author.avatarUrl} name={video.author.displayName} size={46} ring />
        </Link>
        {!isOwn && (!video.viewer.followingAuthor || followJustNow) && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onClick={() => void follow()}
            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-5.5 h-5.5 rounded-full flex items-center justify-center text-white shadow-lg ${
              video.viewer.followingAuthor ? "bg-vado-success" : "bg-gradient-to-r from-vado-blue to-vado-purple"
            }`}
            style={{ width: 22, height: 22 }}
            aria-label={video.viewer.followingAuthor ? "Following" : "Follow"}
          >
            {video.viewer.followingAuthor ? <Check size={12} /> : <Plus size={13} />}
          </motion.button>
        )}
      </div>
      <RailButton
        icon={<Heart size={23} fill={video.viewer.liked ? "#FF5C7A" : "none"} className={video.viewer.liked ? "text-[#FF5C7A]" : "text-white"} />}
        label={formatCount(video.counts.likes)}
        active={video.viewer.liked}
        activeColor="#FF5C7A"
        burst
        onClick={() => void toggleAction("like")}
      />
      <RailButton
        icon={<MessageCircle size={22} className="text-white" />}
        label={formatCount(video.counts.comments)}
        onClick={() => onOpenComments(video)}
      />
      <RailButton
        icon={<Bookmark size={22} fill={video.viewer.saved ? "#FFC24B" : "none"} className={video.viewer.saved ? "text-[#FFC24B]" : "text-white"} />}
        label={formatCount(video.counts.saves)}
        active={video.viewer.saved}
        activeColor="#FFC24B"
        burst
        onClick={() => void toggleAction("save")}
      />
      <RailButton
        icon={<Repeat2 size={23} className={video.viewer.reposted ? "text-[#34D399]" : "text-white"} />}
        label={formatCount(video.counts.reposts)}
        active={video.viewer.reposted}
        activeColor="#34D399"
        burst
        onClick={() => void toggleAction("repost")}
      />
      <RailButton
        icon={<Share2 size={21} className="text-white" />}
        label={formatCount(video.counts.shares)}
        onClick={() => onOpenShare(video)}
      />
      <div className="relative">
        <RailButton icon={<MoreHorizontal size={21} className="text-white" />} label="" onClick={() => setMenuOpen((o) => !o)} />
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="absolute bottom-14 right-0 glass-deep rounded-2xl p-1.5 w-44 z-30"
            >
              <button onClick={() => void copyLink()} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 transition text-left">
                <Link2 size={14} className="text-vado-cyan" /> Copy link
              </button>
              {isOwn ? (
                <button
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 transition text-vado-danger text-left"
                >
                  <Trash2 size={14} /> Delete video
                </button>
              ) : (
                <button
                  onClick={() => { setMenuOpen(false); if (!user) return promptAuth("Sign in to report content"); setReportOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 transition text-vado-warn text-left"
                >
                  <Flag size={14} /> Report
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full flex items-center justify-center gap-3 md:py-3">
      <div
        className="relative h-full w-full md:w-auto md:max-w-full overflow-hidden bg-black md:rounded-3xl md:border md:border-white/12 md:shadow-[0_20px_80px_rgba(3,6,20,0.7)]"
        style={{ aspectRatio: `${video.width}/${video.height}` }}
      >
        <video
          ref={ref}
          src={video.videoUrl}
          poster={video.thumbnailUrl ?? undefined}
          loop
          playsInline
          muted={muted}
          preload={active || near ? "auto" : "metadata"}
          className="absolute inset-0 w-full h-full object-cover"
          onTimeUpdate={(e) => {
            const v = e.currentTarget;
            if (v.duration > 0) {
              const p = v.currentTime / v.duration;
              setProgress(p);
              if (p > 0.95) watch.current.completed = true;
            }
          }}
          onWaiting={() => setBuffering(true)}
          onPlaying={() => { setBuffering(false); setPlaying(true); }}
          onPause={() => setPlaying(false)}
          onCanPlay={() => setBuffering(false)}
        />

        {/* tap surface */}
        <div className="absolute inset-0" onClick={onSurfaceClick} onDoubleClick={onSurfaceDouble}>
          <div className="absolute inset-0 video-scrim pointer-events-none" />
          <AnimatePresence>
            {hearts.map((h) => (
              <motion.div
                key={h.id}
                initial={{ scale: 0, opacity: 0, rotate: -12 }}
                animate={{ scale: [0, 1.35, 1.1], opacity: [0, 1, 1], rotate: 0 }}
                exit={{ scale: 1.6, opacity: 0, y: -60 }}
                transition={{ duration: 0.55 }}
                className="absolute pointer-events-none"
                style={{ left: h.x - 45, top: h.y - 45 }}
              >
                <Heart size={90} fill="#FF5C7A" className="text-[#FF5C7A] drop-shadow-[0_0_28px_rgba(255,92,122,0.8)]" />
              </motion.div>
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {!playing && active && (
              <motion.div
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.3 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <span className="glass-deep w-20 h-20 rounded-full flex items-center justify-center">
                  <Play size={34} className="text-white ml-1" fill="white" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          {buffering && active && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <Loader2 size={36} className="text-vado-cyan animate-spin" />
            </div>
          )}
        </div>

        {/* top chips */}
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20 pt-[env(safe-area-inset-top)]">
          {video.visibility !== "public" && isOwn && (
            <span className="glass-deep rounded-full px-2.5 py-1.5 text-[10px] font-bold flex items-center gap-1 text-vado-warn">
              {video.visibility === "private" ? <Lock size={11} /> : <Users size={11} />}
              {video.visibility === "private" ? "Private" : "Followers"}
            </span>
          )}
          <button
            onClick={() => setMuted(!muted)}
            className="glass-deep w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/15 transition"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={16} className="text-vado-sub" /> : <Volume2 size={16} className="text-vado-cyan" />}
          </button>
        </div>

        {/* info overlay */}
        <div className="absolute left-3.5 right-16 md:right-4 bottom-[92px] md:bottom-5 z-10 flex flex-col gap-1.5">
          <Link href={`/profile/${video.author.username}`} className="flex items-center gap-2 w-fit group">
            <span className="font-extrabold text-[15px] text-white drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] group-hover:text-vado-cyan transition">
              @{video.author.username}
            </span>
            {video.viewer.followingAuthor && <Check size={13} className="text-vado-cyan" />}
          </Link>
          <p className="text-[13px] text-white/95 leading-snug drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
            {(expanded || !captionLong ? video.caption : `${video.caption.slice(0, 92)}…`).split(/(#[\p{L}\p{N}_]+)/gu).map((part, i) =>
              part.startsWith("#") ? (
                <Link key={i} href={`/hashtag/${part.slice(1).toLowerCase()}`} className="text-vado-cyan font-semibold hover:underline">
                  {part}
                </Link>
              ) : (
                <span key={i}>{part}</span>
              )
            )}
            {captionLong && (
              <button onClick={() => setExpanded(!expanded)} className="ml-1 text-vado-sub font-bold text-xs">
                {expanded ? "less" : "more"}
              </button>
            )}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <Music2 size={13} className="text-white shrink-0" />
            <div className="overflow-hidden w-44 relative h-4">
              <div className={`absolute whitespace-nowrap text-[11px] text-white/90 ${video.soundTitle.length > 26 ? "marquee" : ""}`}>
                {video.soundTitle}
                {video.soundTitle.length > 26 && <span className="mx-8">{video.soundTitle}</span>}
              </div>
            </div>
            <span className="glass-deep rounded-full p-1 ml-1 spin-slow shrink-0">
              <Avatar src={video.author.avatarUrl} name={video.author.displayName} size={18} />
            </span>
          </div>
        </div>

        {/* mobile rail */}
        <div className="absolute right-2 bottom-24 z-20 md:hidden">{rail}</div>

        {/* seek bar */}
        <div className="absolute bottom-[78px] md:bottom-0 inset-x-0 h-5 z-20 group flex items-end px-0">
          <div className="relative w-full h-[3px] group-hover:h-[6px] transition-all bg-white/20">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-vado-cyan to-vado-purple"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={(e) => {
              const v = ref.current;
              if (v && v.duration) {
                v.currentTime = (Number(e.target.value) / 1000) * v.duration;
                setProgress(Number(e.target.value) / 1000);
              }
            }}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            aria-label="Seek"
          />
        </div>
      </div>

      {/* desktop rail */}
      <div className="hidden md:flex self-end pb-6">{rail}</div>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} target={{ type: "video", id: video.id }} />
      <Modal open={confirmDelete} onClose={() => setConfirmDelete(false)} title="Delete this video?">
        <p className="text-sm text-vado-sub leading-relaxed">
          This permanently removes the video, its comments and likes. This can't be undone.
        </p>
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setConfirmDelete(false)} className="flex-1 glass-soft rounded-xl py-2.5 text-sm font-bold hover:bg-white/10 transition">
            Keep it
          </button>
          <button onClick={() => void deleteVideo()} className="flex-1 rounded-xl py-2.5 text-sm font-bold bg-vado-danger/90 hover:bg-vado-danger text-white transition">
            Delete forever
          </button>
        </div>
      </Modal>
    </div>
  );
}
