import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock, Search, TrendingUp, Users, X } from 'lucide-react';
import { CATEGORIES, GLOBAL_VIBES, HASHTAGS, USERS, fmt } from '../data/mock';
import { load, save } from '../lib/store';
import { Chip, EmptyState } from '../components/ui';

export function SearchScreen({
  onClose,
  onOpenProfile,
}: {
  onClose: () => void;
  onOpenProfile: (handle?: string) => void;
}) {
  const reduce = useReducedMotion();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [recent, setRecent] = useState<string[]>(() => load<string[]>('recentSearches', []));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const remember = (term: string) => {
    const t = term.trim();
    if (!t) return;
    setRecent((prev) => {
      const next = [t, ...prev.filter((x) => x !== t)].slice(0, 8);
      save('recentSearches', next);
      return next;
    });
  };

  const low = query.trim().toLowerCase();
  const vibes = useMemo(() => {
    let list = GLOBAL_VIBES;
    if (category) list = list.filter((v) => v.category === category);
    if (low) {
      list = list.filter((v) =>
        [v.caption, v.creator, v.handle, v.category, v.mood, ...v.hashtags].join(' ').toLowerCase().includes(low)
      );
    }
    return list;
  }, [low, category]);

  const people = useMemo(
    () => (low ? USERS.filter((u) => `${u.name} ${u.handle} ${u.bio}`.toLowerCase().includes(low)) : []),
    [low]
  );

  const searching = low !== '' || category !== null;

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-40 flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative mt-2 flex h-[calc(100%-8px)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#d8f3ff]/35 bg-[#0a1f38]/95 shadow-glow-lg backdrop-blur-2xl">
        <div className="flex shrink-0 items-center gap-2 border-b border-[#d8f3ff]/15 p-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[#d8f3ff]/30 bg-volt/10 px-4 py-2.5">
            <Search size={15} className="shrink-0 text-mist" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && remember(query)}
              placeholder="Search vibes, creators, moods, #tags…"
              aria-label="Search vibes, creators, moods and tags"
              className="min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-mist/60 outline-none"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="text-mist hover:text-ink">
                <X size={15} />
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#d8f3ff]/25 bg-glass text-mist transition-colors hover:text-ink"
            aria-label="Close search"
          >
            <X size={17} />
          </button>
        </div>

        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-4">
          <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
            <Chip active={category === null} onClick={() => setCategory(null)} className="shrink-0">
              All
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)} className="shrink-0">
                {c}
              </Chip>
            ))}
          </div>

          {!searching && recent.length > 0 && (
            <section className="mb-5">
              <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
                <Clock size={12} /> Recent searches
              </h3>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <Chip key={r} onClick={() => setQuery(r)}>{r}</Chip>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setRecent([]);
                    save('recentSearches', []);
                  }}
                  className="text-[11px] text-mist underline-offset-2 hover:text-ink hover:underline"
                >
                  Clear
                </button>
              </div>
            </section>
          )}

          {!searching && (
            <section className="mb-5">
              <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
                <TrendingUp size={12} /> Trending tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {HASHTAGS.map((h) => (
                  <Chip key={h} onClick={() => { setQuery(h); remember(h); }}>{h}</Chip>
                ))}
              </div>
            </section>
          )}

          {people.length > 0 && (
            <section className="mb-5">
              <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
                <Users size={12} /> People
              </h3>
              <ul className="space-y-2">
                {people.map((u) => (
                  <li key={u.handle}>
                    <button
                      type="button"
                      onClick={() => { remember(u.handle); onOpenProfile(u.handle); }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3 py-2.5 text-left backdrop-blur-lg transition-colors hover:border-beam/60"
                    >
                      <span className="h-9 w-9 shrink-0 rounded-full" style={{ background: u.avatar }} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-semibold text-ink">{u.name}</span>
                        <span className="block truncate text-[11px] text-mist">{u.handle} · {fmt(u.followers)} followers</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {searching ? (
            vibes.length === 0 && people.length === 0 ? (
              <EmptyState
                icon={<Search size={26} />}
                title="No results"
                body={`Nothing matches “${query || category}”. Try a mood, a creator, or another tag.`}
              />
            ) : (
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {vibes.map((v) => (
                  <li key={v.id}>
                    <button
                      type="button"
                      onClick={() => { remember(query || category || 'vibe'); }}
                      className="flex w-full items-center gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-glass p-2.5 text-left backdrop-blur-lg transition-colors hover:border-beam/60"
                    >
                      <span className="h-14 w-14 shrink-0 rounded-xl" style={{ background: v.gradient }} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink">{v.caption}</span>
                        <span className="block truncate text-[11px] text-mist">{v.creator} · {fmt(v.views)} views · {v.category}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )
          ) : (
            <section>
              <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Popular right now</h3>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[...GLOBAL_VIBES]
                  .sort((a, b) => b.views - a.views)
                  .slice(0, 4)
                  .map((v) => (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => setQuery(v.category)}
                        className="flex w-full items-center gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-glass p-2.5 text-left backdrop-blur-lg transition-colors hover:border-beam/60"
                      >
                        <span className="h-14 w-14 shrink-0 rounded-xl" style={{ background: v.gradient }} aria-hidden="true" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-ink">{v.caption}</span>
                          <span className="block truncate text-[11px] text-mist">{fmt(v.views)} views · {v.category}</span>
                        </span>
                      </button>
                    </li>
                  ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </motion.div>
  );
}
