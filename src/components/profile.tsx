"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3X3, Heart, Bookmark, Repeat2, Lock, MoreHorizontal, Flag, Ban, Settings,
  MessageSquare, Check, Plus, UserX, MailWarning, Camera, Upload, Pencil,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { Avatar, Spinner, EmptyState, Modal, Toggle, Field, inputCls } from "@/components/ui";
import { VideoGrid } from "@/components/video/VideoGrid";
import { ReportModal } from "@/components/video/ReportModal";
import { api, post, uploadFile } from "@/lib/client";
import { formatCount, CATEGORY_LIST } from "@/lib/format";
import type { ProfileDTO, VideoDTO } from "@/lib/types";

type Tab = "videos" | "liked" | "saved" | "reposts";

export function ProfileView({ username }: { username: string }) {
  const { user, refresh, toast, promptAuth } = useApp();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [videos, setVideos] = useState<VideoDTO[]>([]);
  const [tab, setTab] = useState<Tab>("videos");
  const [loading, setLoading] = useState(true);
  const [gridLoading, setGridLoading] = useState(false);
  const [locked, setLocked] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockConfirm, setBlockConfirm] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [verifyUrl, setVerifyUrl] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const load = useCallback(async (t: Tab, append = false) => {
    if (append) setGridLoading(true);
    else setGridLoading(true);
    try {
      const offset = append ? videos.length : 0;
      const d = await api<{ profile: ProfileDTO; videos: VideoDTO[]; hasMore: boolean; locked?: boolean; blocked?: boolean }>(
        `/api/users/${encodeURIComponent(username)}?tab=${t}&offset=${offset}&limit=18`
      );
      setProfile(d.profile);
      setLocked(!!d.locked);
      setVideos((p) => (append ? [...p, ...d.videos.filter((v) => !p.some((x) => x.id === v.id))] : d.videos));
      setHasMore(d.hasMore);
      setNotFound(false);
    } catch {
      if (!append) setNotFound(true);
    } finally {
      setLoading(false);
      setGridLoading(false);
    }
  }, [username, videos.length]);

  useEffect(() => {
    setLoading(true);
    setTab("videos");
    setVideos([]);
    void load("videos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setVideos([]);
    void load(t);
  };

  const follow = async () => {
    if (!user) return promptAuth("Sign in to follow creators");
    if (!profile) return;
    const current = profile.viewer.following;
    setProfile({
      ...profile,
      viewer: { ...profile.viewer, following: !current },
      counts: { ...profile.counts, followers: profile.counts.followers + (current ? -1 : 1) },
    });
    try {
      const r = await post<{ active: boolean; followers: number }>(`/api/users/${profile.id}/follow`);
      setProfile((p) => p && { ...p, viewer: { ...p.viewer, following: r.active }, counts: { ...p.counts, followers: r.followers } });
      if (r.active) toast(`Following ${profile.displayName}`, "success");
    } catch (e) {
      setProfile((p) => p && { ...p, viewer: { ...p.viewer, following: current }, counts: { ...p.counts, followers: p.counts.followers + (current ? 1 : -1) } });
      toast(e instanceof Error ? e.message : "Couldn't follow", "error");
    }
  };

  const message = async () => {
    if (!user) return promptAuth("Sign in to send messages");
    if (!profile) return;
    try {
      const r = await post<{ id: string }>("/api/conversations", { userId: profile.id });
      router.push(`/inbox?c=${r.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't open chat", "error");
    }
  };

  const block = async () => {
    if (!profile) return;
    try {
      const r = await post<{ active: boolean }>(`/api/users/${profile.id}/block`);
      setBlockConfirm(false);
      setMenuOpen(false);
      toast(r.active ? `Blocked @${profile.username}` : `Unblocked @${profile.username}`, "success");
      setVideos([]);
      void load(tab);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't block", "error");
    }
  };

  const resendVerify = async () => {
    try {
      const r = await post<{ devVerifyUrl: string | null }>("/api/auth/verify/resend");
      if (r.devVerifyUrl) setVerifyUrl(r.devVerifyUrl);
      else toast("Verification email sent", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't resend", "error");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 pt-8 pb-28">
        <div className="glass rounded-3xl p-8 flex items-center gap-6">
          <div className="w-24 h-24 rounded-full shimmer" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-44 rounded-full shimmer" />
            <div className="h-3 w-28 rounded-full shimmer" />
            <div className="h-3 w-64 rounded-full shimmer" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 mt-6">
          {[...Array(8)].map((_, i) => <div key={i} className="aspect-[9/14] rounded-2xl shimmer" />)}
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 pb-24">
        <EmptyState
          icon={UserX}
          title={user ? `@${username} doesn't exist` : "Sign in to view profiles"}
          sub={user ? "The account may have been removed or the handle is wrong." : "Profiles are available after signing in — or keep browsing the feed as a guest."}
          action={<Link href="/discover" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white">Discover creators</Link>}
        />
      </div>
    );
  }

  const tabs: { id: Tab; icon: React.ReactNode; label: string; hidden?: boolean }[] = [
    { id: "videos", icon: <Grid3X3 size={15} />, label: "Videos" },
    { id: "liked", icon: <Heart size={15} />, label: "Liked" },
    { id: "saved", icon: <Bookmark size={15} />, label: "Saved", hidden: !profile.viewer.isSelf },
    { id: "reposts", icon: <Repeat2 size={15} />, label: "Reposts" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-28 lg:pb-12">
      {/* Verify banner */}
      {profile.viewer.isSelf && user && !user.emailVerified && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3 border-vado-warn/30">
          <MailWarning size={16} className="text-vado-warn shrink-0" />
          <span className="text-xs font-semibold flex-1">Verify your email to secure your account.</span>
          {verifyUrl ? (
            <Link href={verifyUrl} className="btn-primary rounded-lg px-3 py-1.5 text-[11px] font-bold text-white">Verify now (dev link)</Link>
          ) : (
            <button onClick={() => void resendVerify()} className="glass-soft rounded-lg px-3 py-1.5 text-[11px] font-bold hover:bg-white/10 transition">Resend email</button>
          )}
        </motion.div>
      )}

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-[2rem] p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-vado-purple/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-vado-blue/15 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar src={profile.avatarUrl} name={profile.displayName} size={96} ring />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-extrabold truncate">{profile.displayName}</h1>
            <p className="text-sm text-vado-sub flex items-center gap-2 flex-wrap">
              @{profile.username}
              {profile.viewer.followsYou && <span className="glass-soft rounded-full px-2 py-0.5 text-[9px] font-bold text-vado-cyan">Follows you</span>}
            </p>
            <div className="flex items-center gap-5 mt-3">
              {[
                { n: profile.counts.following, l: "Following" },
                { n: profile.counts.followers, l: "Followers" },
                { n: profile.counts.likesReceived, l: "Likes" },
              ].map((s) => (
                <span key={s.l} className="text-center">
                  <span className="block font-extrabold text-lg leading-none">{formatCount(s.n)}</span>
                  <span className="block text-[10px] text-vado-sub font-semibold mt-1">{s.l}</span>
                </span>
              ))}
            </div>
            {profile.bio && <p className="text-sm text-vado-text/85 mt-3 leading-relaxed max-w-lg whitespace-pre-line">{profile.bio}</p>}
          </div>
          <div className="flex sm:flex-col gap-2 shrink-0">
            {profile.viewer.isSelf ? (
              <>
                <button onClick={() => setEditOpen(true)} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2">
                  <Pencil size={14} /> Edit profile
                </button>
                <Link href="/settings" className="glass-soft rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-white/10 transition flex items-center gap-2 justify-center">
                  <Settings size={14} /> Settings
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => void follow()}
                  className={`rounded-xl px-6 py-2.5 text-sm font-bold transition flex items-center gap-2 justify-center ${
                    profile.viewer.following ? "glass-soft text-vado-success hover:bg-white/10" : "btn-primary text-white"
                  }`}
                >
                  {profile.viewer.following ? <><Check size={14} /> Following</> : <><Plus size={14} /> Follow</>}
                </button>
                <div className="flex gap-2">
                  <button onClick={() => void message()} className="glass-soft flex-1 rounded-xl px-4 py-2.5 text-sm font-bold hover:bg-white/10 transition flex items-center gap-2 justify-center">
                    <MessageSquare size={14} /> Message
                  </button>
                  <div className="relative">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="glass-soft rounded-xl px-3 py-2.5 hover:bg-white/10 transition h-full" aria-label="More options">
                      <MoreHorizontal size={16} />
                    </button>
                    <AnimatePresence>
                      {menuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 6, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 6, scale: 0.95 }}
                          className="absolute right-0 top-full mt-2 glass-deep rounded-2xl p-1.5 w-44 z-30"
                        >
                          <button
                            onClick={() => { setMenuOpen(false); if (!user) return promptAuth("Sign in to report accounts"); setReportOpen(true); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 transition text-vado-warn"
                          >
                            <Flag size={14} /> Report account
                          </button>
                          <button
                            onClick={() => { setMenuOpen(false); if (!user) return promptAuth("Sign in to block accounts"); setBlockConfirm(true); }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-white/10 transition text-vado-danger"
                          >
                            <Ban size={14} /> {profile.viewer.blocked ? "Unblock" : "Block"} account
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {profile.viewer.blocked ? (
        <div className="mt-8">
          <EmptyState
            icon={Ban}
            title={`You blocked @${profile.username}`}
            sub="You won't see each other's content, comments or messages."
            action={<button onClick={() => void block()} className="glass-soft rounded-xl px-5 py-2.5 text-sm font-bold hover:bg-white/10 transition">Unblock</button>}
          />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1.5 mt-6 mb-5 overflow-x-auto no-scrollbar">
            {tabs.filter((t) => !t.hidden).map((t) => (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`relative px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition ${tab === t.id ? "text-white" : "text-vado-sub glass-soft hover:text-vado-text"}`}
              >
                {tab === t.id && (
                  <motion.span layoutId="profile-tab" className="absolute inset-0 rounded-xl bg-gradient-to-r from-vado-blue/70 to-vado-purple/70" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <span className="relative flex items-center gap-2">
                  {t.icon} {t.label}
                  {t.id === "liked" && locked && <Lock size={11} />}
                </span>
              </button>
            ))}
          </div>

          {gridLoading && videos.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {[...Array(8)].map((_, i) => <div key={i} className="aspect-[9/14] rounded-2xl shimmer" />)}
            </div>
          ) : locked ? (
            <EmptyState icon={Lock} title="Liked videos are private" sub={`${profile.displayName} keeps their likes to themselves.`} />
          ) : videos.length === 0 ? (
            <EmptyState
              icon={tab === "videos" ? Camera : tab === "liked" ? Heart : tab === "saved" ? Bookmark : Repeat2}
              title={
                tab === "videos" ? (profile.viewer.isSelf ? "Your stage is empty" : "No videos yet")
                : tab === "liked" ? "No liked videos"
                : tab === "saved" ? "Nothing saved yet"
                : "No reposts yet"
              }
              sub={
                tab === "videos" ? (profile.viewer.isSelf ? "Record or upload your first video — it takes under a minute." : "Check back soon for their first drop.")
                : tab === "saved" ? "Tap the bookmark on any video to keep it here."
                : tab === "liked" ? "Double-tap videos you love."
                : "Reposts you share appear here."
              }
              action={
                tab === "videos" && profile.viewer.isSelf ? (
                  <Link href="/create" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white flex items-center gap-2">
                    <Upload size={14} /> Upload your first video
                  </Link>
                ) : undefined
              }
            />
          ) : (
            <>
              <VideoGrid videos={videos} showAuthor={tab !== "videos"} />
              {hasMore && (
                <button onClick={() => void load(tab, true)} disabled={gridLoading} className="glass-soft rounded-xl px-5 py-2.5 text-sm font-bold mx-auto block mt-6 hover:bg-white/10 transition">
                  {gridLoading ? "Loading…" : "Load more"}
                </button>
              )}
            </>
          )}
        </>
      )}

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} target={{ type: "user", id: profile.id }} />

      <Modal open={blockConfirm} onClose={() => setBlockConfirm(false)} title={profile.viewer.blocked ? "Unblock account?" : "Block account?"}>
        <p className="text-sm text-vado-sub leading-relaxed">
          {profile.viewer.blocked
            ? `You'll be able to see @${profile.username}'s content again.`
            : `@${profile.username} won't be able to follow, message or interact with you. You'll both disappear from each other's feeds. Any follows between you are removed.`}
        </p>
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setBlockConfirm(false)} className="flex-1 glass-soft rounded-xl py-2.5 text-sm font-bold hover:bg-white/10 transition">Cancel</button>
          <button onClick={() => void block()} className="flex-1 rounded-xl py-2.5 text-sm font-bold bg-vado-danger/90 hover:bg-vado-danger text-white transition">
            {profile.viewer.blocked ? "Unblock" : "Block"}
          </button>
        </div>
      </Modal>

      {profile.viewer.isSelf && user && (
        <EditProfileModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          onSaved={(p) => {
            setProfile(p);
            void refresh();
          }}
          profile={profile}
        />
      )}
    </div>
  );
}

/* ── Edit profile ───────────────────────────────────────── */

function EditProfileModal({
  open, onClose, onSaved, profile,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (p: ProfileDTO) => void;
  profile: ProfileDTO;
}) {
  const { user, setUser, toast } = useApp();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [bio, setBio] = useState(profile.bio);
  const [interests, setInterests] = useState<string[]>(user?.interests ?? []);
  const [likedPublic, setLikedPublic] = useState(profile.likedVideosPublic);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(profile.avatarUrl);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDisplayName(profile.displayName);
      setBio(profile.bio);
      setInterests(user?.interests ?? []);
      setLikedPublic(profile.likedVideosPublic);
      setAvatarPreview(profile.avatarUrl);
      setAvatarFile(null);
    }
  }, [open, profile, user]);

  const save = async () => {
    setBusy(true);
    try {
      let avatarKey: string | undefined;
      if (avatarFile) {
        const up = await uploadFile(avatarFile, "avatar", () => {});
        avatarKey = up.key;
      }
      const body: Record<string, unknown> = { displayName, bio, interests, likedVideosPublic: likedPublic };
      if (avatarKey) body.avatarKey = avatarKey;
      const r = await api<{ user: NonNullable<typeof user> }>("/api/users/me", { method: "PATCH", body: JSON.stringify(body) });
      setUser(r.user);
      onSaved({
        ...profile,
        displayName: r.user.displayName,
        bio: r.user.bio,
        likedVideosPublic: r.user.likedVideosPublic,
        avatarUrl: r.user.avatarUrl ? (r.user.avatarUrl.startsWith("avatars/") ? `/api/media?key=${encodeURIComponent(r.user.avatarUrl)}` : r.user.avatarUrl) : null,
      });
      toast("Profile updated ✨", "success");
      onClose();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save profile", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit profile" wide>
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-4">
          <Avatar src={avatarPreview} name={displayName} size={72} ring />
          <div>
            <button onClick={() => fileRef.current?.click()} className="glass-soft rounded-xl px-4 py-2 text-xs font-bold hover:bg-white/10 transition flex items-center gap-2">
              <Camera size={13} /> Change photo
            </button>
            <p className="text-[10px] text-vado-sub mt-1.5">JPG, PNG or WebP · max 8 MB</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  if (f.size > 8 * 1024 * 1024) return toast("Image max 8 MB", "error");
                  setAvatarFile(f);
                  setAvatarPreview(URL.createObjectURL(f));
                }
                e.target.value = "";
              }}
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Display name">
            <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={40} />
          </Field>
          <Field label="Username" hint="Handles are permanent in this version">
            <input className={`${inputCls} opacity-50`} value={`@${profile.username}`} disabled />
          </Field>
        </div>
        <Field label="Bio" hint={`${bio.length}/200`}>
          <textarea className={`${inputCls} resize-none`} rows={3} value={bio} onChange={(e) => setBio(e.target.value)} maxLength={200} placeholder="Tell the feed who you are…" />
        </Field>
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-vado-sub mb-2">Interests (tunes your For You)</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_LIST.map((c) => (
              <button
                key={c.slug}
                onClick={() => setInterests((p) => (p.includes(c.slug) ? p.filter((x) => x !== c.slug) : [...p, c.slug]))}
                className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${interests.includes(c.slug) ? "text-white" : "glass-soft text-vado-sub hover:text-vado-text"}`}
                style={interests.includes(c.slug) ? { background: `linear-gradient(94deg, ${c.hue}cc, ${c.hue}77)` } : undefined}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="glass-soft rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Public liked videos</p>
            <p className="text-[11px] text-vado-sub">Let others see the Liked tab on your profile</p>
          </div>
          <Toggle on={likedPublic} onChange={setLikedPublic} label="Public likes" />
        </div>
        <button onClick={() => void save()} disabled={busy || !displayName.trim()} className="btn-primary rounded-2xl py-3 font-bold text-white">
          {busy ? "Saving…" : "Save changes"}
        </button>
      </div>
    </Modal>
  );
}
