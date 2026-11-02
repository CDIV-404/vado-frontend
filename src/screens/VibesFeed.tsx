import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Bell, CalendarHeart, Link2, MessageCircle, Orbit, Plus, RefreshCw, Search, Send, Sparkles } from 'lucide-react';
import {
  COMMENTS,
  DAILY_STATS,
  FOLLOWING_VIBES,
  GLOBAL_VIBES,
  NOTIFICATIONS,
  TODAY_PROMPTS,
  type Vibe,
} from '../data/mock';
import { load, save } from '../lib/store';
import { useToast } from '../components/Toast';
import { VibeCard } from '../components/VibeCard';
import { EmptyState, Sheet, Skeleton } from '../components/ui';

type FeedTab = 'following' | 'global';

export function VibesFeed({
  exploreGlobalKey,
  published,
  session,
  onOpenProfile,
  onNotifications,
  onCreate,
  onSearch,
  onOpenMood,
  onRemixVibe,
}: {
  exploreGlobalKey: number;
  published: Vibe[];
  session: string | null;
  onOpenProfile: (handle?: string) => void;
  onNotifications: () => void;
  onCreate: () => void;
  onSearch: () => void;
  onOpenMood: () => void;
  onRemixVibe: (vibe: Vibe) => void;
}) {
  const reduce = useReducedMotion();
  const toast = useToast();
  const [tab, setTab] = useState<FeedTab>(() => load<FeedTab>('feedTab', 'global'));
  const [loading, setLoading] = useState(true);
  const [commentVibe, setCommentVibe] = useState<Vibe | null>(null);
  const [shareVibe, setShareVibe] = useState<Vibe | null>(null);
  const [likedIds, setLikedIds] = useState<string[]>(() => load<string[]>('liked', []));
  const [savedIds, setSavedIds] = useState<string[]>(() => load<string[]>('saved', []));
  const [extraComments, setExtraComments] = useState<Record<string, { id: string; author: string; text: string; time: string }[]>>({});
  const [notifVersion, setNotifVersion] = useState(0);

  useEffect(() => {
    const fn = () => setNotifVersion((v) => v + 1);
    window.addEventListener('vado:notifs', fn);
    return () => window.removeEventListener('vado:notifs', fn);
  }, []);

  useEffect(() => {
    if (exploreGlobalKey > 0) setTab('global');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exploreGlobalKey]);

  useEffect(() => {
    setLoading(true);
    const t = window.setTimeout(() => setLoading(false), 700);
    return () => window.clearTimeout(t);
  }, [tab, exploreGlobalKey]);

  const unreadNotifs = useMemo(() => {
    void notifVersion;
    const read = load<string[]>('notifRead', []);
    return NOTIFICATIONS.filter((n) => n.unread && !read.includes(n.id)).length;
  }, [notifVersion]);

  const changeTab = (t: FeedTab) => {
    setTab(t);
    save('feedTab', t);
  };

  const source = useMemo(
    () => [...published, ...(tab === 'global' ? GLOBAL_VIBES : FOLLOWING_VIBES)],
    [tab, published]
  );

  const toggleLike = (id: string) => {
    setLikedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      save('liked', next);
      return next;
    });
  };
  const toggleSave = (id: string) => {
    const wasSaved = savedIds.includes(id);
    const next = wasSaved ? savedIds.filter((x) => x !== id) : [...savedIds, id];
    save('saved', next);
    setSavedIds(next);
    toast(wasSaved ? 'Removed from saved' : 'Saved to your collection');
  };

  const addComment = (vibe: Vibe, text: string) => {
    setExtraComments((prev) => ({
      ...prev,
      [vibe.id]: [
        ...(prev[vibe.id] ?? []),
        { id: `x${Date.now()}`, author: session ? `@${session.toLowerCase().replace(/\s+/g, '.')}` : '@you', text, time: 'now' },
      ],
    }));
  };

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-[#d8f3ff]/10 bg-deep/70 px-4 pb-2 pt-4 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-5xl items-center gap-2">
          <button
            type="button"
            onClick={() => onOpenProfile()}
            aria-label="Open your profile"
            className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-volt to-beam ring-1 ring-[#d8f3ff]/40 transition-transform hover:scale-105"
          />
          <div role="tablist" aria-label="Feed" className="flex flex-1 items-center justify-center gap-5">
            {(['following', 'global'] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => changeTab(t)}
                className={`relative pb-1 text-[13px] font-medium capitalize transition-colors ${
                  tab === t ? 'text-beam' : 'text-mist hover:text-ink'
                }`}
              >
                {t}
                {tab === t && (
                  <motion.span
                    layoutId="feed-tab"
                    className="absolute inset-x-0 -bottom-px h-[2px] rounded-full bg-beam shadow-glow"
                  />
                )}
              </button>
            ))}
          </div>
          <IconBtn label="Search" onClick={onSearch}>
            <Search size={16} />
          </IconBtn>
          <IconBtn label="Create a Vibe" onClick={onCreate}>
            <Plus size={18} />
          </IconBtn>
          <IconBtn label={`Notifications${unreadNotifs > 0 ? `, ${unreadNotifs} unread` : ''}`} onClick={onNotifications}>
            <span className="relative">
              <Bell size={16} />
              {unreadNotifs > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-beam px-1 text-[9px] font-bold text-[#04121f]">
                  {unreadNotifs}
                </span>
              )}
            </span>
          </IconBtn>
        </div>
      </header>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <div
            className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 pt-4 md:grid-cols-2 lg:grid-cols-3"
            role="status"
            aria-label="Loading vibes"
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72" />
            ))}
          </div>
        ) : source.length === 0 ? (
          <EmptyState
            icon={<Orbit size={28} />}
            title="Your creative world starts here."
            body={tab === 'following' ? 'Follow creators or publish your first Vibe to fill this feed.' : 'No vibes yet — be the first.'}
            action={
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onCreate}
                  className="rounded-full border border-[#d8f3ff] bg-volt/25 px-5 py-2 text-[13px] font-semibold text-white shadow-glow-in transition-colors hover:bg-volt/40"
                >
                  Create a Vibe
                </button>
                {tab === 'following' && (
                  <button
                    type="button"
                    onClick={() => changeTab('global')}
                    className="rounded-full border border-[#d8f3ff]/25 bg-glass px-5 py-2 text-[13px] text-mist transition-colors hover:text-ink"
                  >
                    Explore Global
                  </button>
                )}
              </div>
            }
          />
        ) : (
          <>
            <TodayCard onCreate={onCreate} onOpenMood={onOpenMood} />
            <div className="mx-auto flex w-full max-w-5xl items-center justify-end pt-3">
              <button
                type="button"
                onClick={() => {
                  setLoading(true);
                  window.setTimeout(() => {
                    setLoading(false);
                    toast('Feed refreshed');
                  }, 700);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff]/25 bg-glass px-3 py-1.5 text-[11px] text-mist backdrop-blur-lg transition-colors hover:text-ink"
              >
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
            <ul className="mx-auto grid w-full max-w-5xl grid-cols-1 gap-4 pt-3 md:grid-cols-2 lg:grid-cols-3">
              {source.map((v, i) => (
                <VibeCard
                  key={`${tab}-${v.id}`}
                  vibe={v}
                  index={i}
                  reduce={!!reduce}
                  liked={likedIds.includes(v.id)}
                  saved={savedIds.includes(v.id)}
                  onToggleLike={() => toggleLike(v.id)}
                  onToggleSave={() => toggleSave(v.id)}
                  onComments={() => setCommentVibe(v)}
                  onShare={() => setShareVibe(v)}
                  onOpenProfile={(handle) => onOpenProfile(handle)}
                  onRemix={() => onRemixVibe(v)}
                />
              ))}
            </ul>
          </>
        )}
      </div>

      <Sheet open={!!commentVibe} onClose={() => setCommentVibe(null)} title={commentVibe ? `Comments on ${commentVibe.creator}’s Vibe` : 'Comments'}>
        {commentVibe && (
          <CommentList
            vibe={commentVibe}
            extra={extraComments[commentVibe.id] ?? []}
            onAdd={(text) => addComment(commentVibe, text)}
          />
        )}
      </Sheet>

      <Sheet open={!!shareVibe} onClose={() => setShareVibe(null)} title="Share Vibe">
        {shareVibe && (
          <div className="space-y-2.5">
            <p className="text-[13px] text-mist">Share “{shareVibe.caption.slice(0, 60)}…”</p>
            <ShareRow
              icon={<Link2 size={16} />}
              label="Copy link"
              onClick={() => {
                navigator.clipboard?.writeText(`https://vado.app/v/${shareVibe.id}`).catch(() => undefined);
                toast('Link copied');
                setShareVibe(null);
              }}
            />
            <ShareRow
              icon={<Send size={16} />}
              label="Send to a chat"
              onClick={() => {
                toast('Shared to your chat (demo)');
                setShareVibe(null);
              }}
            />
            <ShareRow
              icon={<Sparkles size={16} />}
              label="Ask VADO AI to rewrite before sharing"
              onClick={() => {
                setShareVibe(null);
                toast('Open the VADO button to remix this caption');
              }}
            />
          </div>
        )}
      </Sheet>
    </div>
  );
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8f3ff]/30 bg-glass text-ink backdrop-blur-lg transition-colors hover:border-beam/70"
    >
      {children}
    </button>
  );
}

function CommentList({
  vibe,
  extra,
  onAdd,
}: {
  vibe: Vibe;
  extra: { id: string; author: string; text: string; time: string }[];
  onAdd: (text: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const list = [...(COMMENTS[vibe.id] ?? []), ...extra];
  return (
    <div className="flex h-full flex-col gap-3">
      <ul className="space-y-2.5">
        {list.length === 0 && <li className="text-[13px] text-mist">No comments yet — start the conversation.</li>}
        {list.map((c) => (
          <li key={c.id} className="rounded-2xl border border-[#d8f3ff]/20 bg-white/5 px-3 py-2">
            <p className="text-[11px] font-semibold text-sky">{c.author} · {c.time}</p>
            <p className="mt-0.5 text-[13px] text-ink">{c.text}</p>
          </li>
        ))}
      </ul>
      <form
        className="mt-auto flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text) return;
          onAdd(text);
          setDraft('');
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a comment…"
          aria-label="Add a comment"
          className="min-w-0 flex-1 rounded-full border border-[#d8f3ff]/30 bg-volt/10 px-4 py-2 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
        />
        <button
          type="submit"
          aria-label="Post comment"
          disabled={!draft.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-volt to-beam text-white shadow-glow disabled:opacity-40"
        >
          <MessageCircle size={15} />
        </button>
      </form>
    </div>
  );
}

function ShareRow({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-4 py-3 text-left text-[13px] text-ink transition-colors hover:border-beam/60 hover:bg-volt/15"
    >
      <span className="text-beam">{icon}</span>
      {label}
    </button>
  );
}

function dayOfYear(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

function TodayCard({ onCreate, onOpenMood }: { onCreate: () => void; onOpenMood: () => void }) {
  const idx = dayOfYear();
  const prompt = TODAY_PROMPTS[idx % TODAY_PROMPTS.length];
  const pick = GLOBAL_VIBES[idx % GLOBAL_VIBES.length];
  const stats = DAILY_STATS.map((s) => `${s.value} ${s.label}`);
  return (
    <section
      aria-label="Today on VADO"
      className="mx-auto mt-3 w-full max-w-5xl rounded-3xl border border-beam/30 bg-gradient-to-br from-volt/20 via-glass to-transparent p-4 shadow-glow backdrop-blur-lg"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-beam">Today on VADO</p>
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium text-ink">
            Prompt of the day: <span className="text-beam">{prompt}</span>
          </p>
          <p className="mt-1 truncate text-[12px] text-mist">
            Daily pick · @{pick.handle.replace('@', '')} — “{pick.caption}”
          </p>
          <p className="mt-1 text-[11px] text-mist">{stats.join(' · ')}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onCreate}
            className="rounded-full border border-[#d8f3ff] bg-volt/25 px-4 py-2 text-[12px] font-semibold text-white shadow-glow-in transition-colors hover:bg-volt/40"
          >
            Create this
          </button>
          <button
            type="button"
            onClick={onOpenMood}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff]/25 bg-glass px-4 py-2 text-[12px] text-mist transition-colors hover:text-ink"
          >
            <CalendarHeart size={13} /> Log today
          </button>
        </div>
      </div>
    </section>
  );
}
