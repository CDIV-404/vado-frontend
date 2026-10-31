import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Eye, Heart, Music2, Search, X } from 'lucide-react';
import { FOLLOWING_VIBES, GLOBAL_VIBES, type Vibe } from '../data/mock';
import { useToast } from '../components/Toast';

type FeedState = 'error' | 'loading' | 'ready';
type FeedTab = 'following' | 'global';

const persisted = { tab: 'following' as FeedTab, state: 'error' as FeedState };

export function VibesFeed({ exploreGlobalKey }: { exploreGlobalKey: number }) {
  const reduce = useReducedMotion();
  const toast = useToast();
  const [tab, setTab] = useState<FeedTab>(persisted.tab);
  const [state, setStateRaw] = useState<FeedState>(persisted.state);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const setState = (s: FeedState) => {
    persisted.state = s;
    setStateRaw(s);
  };
  const changeTab = (t: FeedTab) => {
    persisted.tab = t;
    setTab(t);
  };

  useEffect(() => {
    if (exploreGlobalKey > 0) loadGlobal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exploreGlobalKey]);

  function loadGlobal() {
    changeTab("global");
    setState('loading');
    window.setTimeout(() => setState('ready'), 900);
  }

  function retry() {
    setState('loading');
    window.setTimeout(() => {
      setState('ready');
      toast('Vibes refreshed');
    }, 900);
  }

  const source = tab === 'global' ? GLOBAL_VIBES : FOLLOWING_VIBES;
  const vibes = query
    ? source.filter((v) => (v.caption + v.creator + v.category).toLowerCase().includes(query.toLowerCase()))
    : source;

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 px-4 pb-2 pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[13px] font-bold tracking-[0.28em] text-ink">VADO</span>
          <div role="tablist" aria-label="Feed" className="flex items-center gap-4">
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
          <button
            type="button"
            aria-label="Search vibes"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8f3ff]/30 bg-glass text-ink backdrop-blur-lg transition-colors hover:border-beam/70"
          >
            {searchOpen ? <X size={16} /> : <Search size={16} />}
          </button>
        </div>
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search vibes…"
                aria-label="Search vibes"
                className="mt-2 w-full rounded-full border border-[#d8f3ff]/30 bg-volt/10 px-4 py-2 text-sm text-ink placeholder:text-mist/70 outline-none focus:border-beam/70"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {state === 'error' && <ErrorState onRetry={retry} onExplore={loadGlobal} />}
        {state === 'loading' && <LoadingState />}
        {state === 'ready' &&
          (vibes.length === 0 ? (
            <p className="mt-16 text-center text-sm text-mist">No vibes match “{query}”.</p>
          ) : (
            <ul className="flex flex-col gap-4 pt-1">
              {vibes.map((v, i) => (
                <VibeCard key={`${tab}-${v.id}`} vibe={v} index={i} reduce={!!reduce} />
              ))}
            </ul>
          ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry, onExplore }: { onRetry: () => void; onExplore: () => void }) {
  return (
    <div className="flex flex-col items-center pt-2 text-center">
      <motion.button
        type="button"
        onClick={onRetry}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-14 mt-1 w-full rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3 py-2 text-[12px] text-mist backdrop-blur-lg hover:text-ink"
      >
        Could not refresh public posts. Tap to retry.
      </motion.button>
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-beam/30 bg-volt/10 text-beam shadow-glow">
        <Music2 size={28} />
      </span>
      <h2 className="text-lg font-semibold text-ink">Vibes are unavailable</h2>
      <p className="mt-1 text-[13px] text-mist">Could not refresh public posts.</p>
      <button
        type="button"
        onClick={onExplore}
        className="mt-6 rounded-full border border-[#d8f3ff] bg-volt/15 px-7 py-2.5 text-[15px] font-medium text-white shadow-glow shadow-glow-in transition-colors hover:bg-volt/30"
      >
        Explore Global
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex justify-center pt-24" role="status" aria-label="Loading vibes">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-beam/25 border-t-beam" />
    </div>
  );
}

function VibeCard({ vibe, index, reduce }: { vibe: Vibe; index: number; reduce: boolean }) {
  return (
    <motion.li
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : index * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="overflow-hidden rounded-3xl border border-[#d8f3ff]/25 bg-glass backdrop-blur-lg"
    >
      <div className="flex items-center gap-2.5 px-3.5 pt-3">
        <span className="h-8 w-8 rounded-full" style={{ background: vibe.gradient }} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold text-ink">{vibe.creator}</p>
          <p className="truncate text-[11px] text-mist">{vibe.handle}</p>
        </div>
        <span className="rounded-full border border-beam/30 bg-volt/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-beam">
          {vibe.category}
        </span>
      </div>
      <div className="mx-3.5 mt-2.5 h-36 rounded-2xl" style={{ background: vibe.gradient }} aria-hidden="true" />
      <p className="px-3.5 pt-2.5 text-[13px] text-ink">{vibe.caption}</p>
      <div className="flex items-center gap-4 px-3.5 py-3 text-[11px] text-mist">
        <span className="inline-flex items-center gap-1">
          <Eye size={13} /> {vibe.views}
        </span>
        <span className="inline-flex items-center gap-1">
          <Heart size={13} /> {vibe.likes}
        </span>
      </div>
    </motion.li>
  );
}
