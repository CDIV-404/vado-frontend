"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, X, Hash, TrendingUp, Music2, Compass, Flame, Clock, ArrowLeft, Users, Check, Plus,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { Avatar, Spinner, EmptyState } from "@/components/ui";
import { VideoGrid } from "@/components/video/VideoGrid";
import { api, post, readLocal, writeLocal } from "@/lib/client";
import { formatCount } from "@/lib/format";
import type { VideoDTO, SearchUser, SearchTag, SearchSound } from "@/lib/types";

type Trending = { name: string; total: number; recent: number; thumbnailUrl: string | null };
type Category = { slug: string; name: string; hue: string; videos: number; views: number };
type Creator = SearchUser & { videos: number };
type Results = { users: SearchUser[]; videos: VideoDTO[]; hashtags: SearchTag[]; sounds: SearchSound[] };

const TABS = ["top", "videos", "users", "hashtags", "sounds"] as const;

export function DiscoverView() {
  const { user, promptAuth, toast } = useApp();
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<(typeof TABS)[number]>("top");
  const [results, setResults] = useState<Results | null>(null);
  const [suggest, setSuggest] = useState<{ users: SearchUser[]; hashtags: SearchTag[] } | null>(null);
  const [focused, setFocused] = useState(false);
  const [searching, setSearching] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [trending, setTrending] = useState<Trending[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [cat, setCat] = useState<Category | null>(null);
  const [catVideos, setCatVideos] = useState<VideoDTO[]>([]);
  const [catMore, setCatMore] = useState(false);
  const [followingSet, setFollowingSet] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setRecent(readLocal<string[]>("vado_recent_searches", []));
    api<{ trending: Trending[]; categories: Category[]; creators: Creator[] }>("/api/discover")
      .then((d) => {
        setTrending(d.trending);
        setCats(d.categories);
        setCreators(d.creators);
        setFollowingSet(new Set(d.creators.filter((c) => c.viewerFollowing).map((c) => c.id)));
      })
      .catch(() => setTrending([]));
  }, []);

  const runSearch = useCallback(async (term: string, t: (typeof TABS)[number]) => {
    setSearching(true);
    setSuggest(null);
    try {
      const data = await api<Results>(`/api/search?q=${encodeURIComponent(term)}&type=${t}`);
      setResults(data);
    } catch {
      toast("Search failed — try again", "error");
    } finally {
      setSearching(false);
    }
  }, [toast]);

  const submit = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    setQ(clean);
    setQuery(clean);
    setCat(null);
    setTab("top");
    void runSearch(clean, "top");
    const nextRecent = [clean, ...recent.filter((r) => r !== clean)].slice(0, 8);
    setRecent(nextRecent);
    writeLocal("vado_recent_searches", nextRecent);
  };

  useEffect(() => {
    if (!q.trim() || query === q) {
      setSuggest(null);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      api<{ users: SearchUser[]; hashtags: SearchTag[] }>(`/api/search?q=${encodeURIComponent(q)}&suggest=1`)
        .then(setSuggest)
        .catch(() => {});
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q, query]);

  const changeTab = (t: (typeof TABS)[number]) => {
    setTab(t);
    if (query) void runSearch(query, t);
  };

  const clearSearch = () => {
    setQ("");
    setQuery("");
    setResults(null);
    setSuggest(null);
  };

  const openCategory = async (c: Category) => {
    setCat(c);
    setQuery("");
    setQ("");
    setResults(null);
    setCatVideos([]);
    try {
      const d = await api<{ videos: VideoDTO[]; hasMore: boolean }>(`/api/feed?category=${c.slug}&limit=12`);
      setCatVideos(d.videos);
      setCatMore(d.hasMore);
    } catch {
      toast("Couldn't load category", "error");
    }
  };

  const loadMoreCat = async () => {
    if (!cat) return;
    const d = await api<{ videos: VideoDTO[]; hasMore: boolean }>(`/api/feed?category=${cat.slug}&limit=12&offset=${catVideos.length}`);
    setCatVideos((p) => [...p, ...d.videos.filter((v) => !p.some((x) => x.id === v.id))]);
    setCatMore(d.hasMore);
  };

  const followCreator = async (id: string) => {
    if (!user) return promptAuth("Sign in to follow creators");
    const active = followingSet.has(id);
    setFollowingSet((s) => {
      const n = new Set(s);
      if (active) n.delete(id);
      else n.add(id);
      return n;
    });
    try {
      await post(`/api/users/${id}/follow`);
    } catch (e) {
      setFollowingSet((s) => {
        const n = new Set(s);
        if (active) n.add(id);
        else n.delete(id);
        return n;
      });
      toast(e instanceof Error ? e.message : "Couldn't follow", "error");
    }
  };

  const userRow = (u: SearchUser) => (
    <div key={u.id} className="glass-soft rounded-2xl px-4 py-3 flex items-center gap-3">
      <Link href={`/profile/${u.username}`}>
        <Avatar src={u.avatarUrl} name={u.displayName} size={44} />
      </Link>
      <Link href={`/profile/${u.username}`} className="min-w-0 flex-1">
        <p className="font-bold text-sm truncate">{u.displayName}</p>
        <p className="text-xs text-vado-sub truncate">@{u.username} · {formatCount(u.followers)} followers</p>
      </Link>
      {user?.id !== u.id && (
        <button
          onClick={() => void followCreator(u.id)}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition flex items-center gap-1.5 ${
            followingSet.has(u.id) || u.viewerFollowing ? "glass-soft text-vado-success" : "btn-primary text-white"
          }`}
        >
          {followingSet.has(u.id) || u.viewerFollowing ? <><Check size={13} /> Following</> : <><Plus size={13} /> Follow</>}
        </button>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-28 lg:pb-12">
      {/* Search bar */}
      <div className="relative z-30">
        <div className="glass rounded-2xl flex items-center gap-3 px-4 py-3 focus-within:border-vado-cyan/50 transition">
          <Search size={18} className="text-vado-cyan shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 180)}
            onKeyDown={(e) => e.key === "Enter" && submit(q)}
            placeholder="Search videos, creators, #hashtags, sounds…"
            className="bg-transparent flex-1 outline-none text-sm placeholder:text-vado-sub/50"
          />
          {(q || query) && (
            <button onClick={clearSearch} className="text-vado-sub hover:text-white transition" aria-label="Clear search">
              <X size={16} />
            </button>
          )}
        </div>
        <AnimatePresence>
          {focused && suggest && (suggest.users.length > 0 || suggest.hashtags.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="absolute top-full mt-2 inset-x-0 glass-deep rounded-2xl p-2 max-h-80 overflow-y-auto"
            >
              {suggest.users.map((u) => (
                <Link key={u.id} href={`/profile/${u.username}`} className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/8 transition">
                  <Avatar src={u.avatarUrl} name={u.displayName} size={30} />
                  <span className="text-sm font-semibold">{u.displayName}</span>
                  <span className="text-xs text-vado-sub">@{u.username}</span>
                </Link>
              ))}
              {suggest.hashtags.map((h) => (
                <button key={h.name} onClick={() => submit(`#${h.name}`)} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/8 transition text-left">
                  <span className="w-[30px] h-[30px] rounded-full glass-soft flex items-center justify-center"><Hash size={14} className="text-vado-cyan" /></span>
                  <span className="text-sm font-semibold">#{h.name}</span>
                  <span className="text-xs text-vado-sub ml-auto">{formatCount(h.uses)} videos</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category browsing */}
      {cat ? (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-5">
            <button onClick={() => setCat(null)} className="glass-soft w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition" aria-label="Back">
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-xl font-extrabold flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ background: cat.hue }} /> {cat.name}
            </h2>
            <span className="text-xs text-vado-sub font-semibold">{cat.videos} videos</span>
          </div>
          {catVideos.length === 0 ? (
            <EmptyState icon={Compass} title="Nothing here yet" sub="Be the first to post in this category." />
          ) : (
            <>
              <VideoGrid videos={catVideos} />
              {catMore && (
                <button onClick={() => void loadMoreCat()} className="glass-soft rounded-xl px-5 py-2.5 text-sm font-bold mx-auto block mt-6 hover:bg-white/10 transition">
                  Load more
                </button>
              )}
            </>
          )}
        </div>
      ) : query ? (
        /* Search results */
        <div className="mt-5">
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => changeTab(t)}
                className={`relative px-4 py-2 rounded-full text-xs font-bold capitalize whitespace-nowrap transition ${tab === t ? "text-white" : "text-vado-sub glass-soft hover:text-vado-text"}`}
              >
                {tab === t && (
                  <motion.span layoutId="discover-tab" className="absolute inset-0 rounded-full bg-gradient-to-r from-vado-blue/70 to-vado-purple/70" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                )}
                <span className="relative">{t}</span>
              </button>
            ))}
          </div>
          {searching ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : results ? (
            <div className="mt-5 flex flex-col gap-6">
              {(tab === "top" || tab === "users") && results.users.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-vado-sub mb-2.5 flex items-center gap-1.5"><Users size={13} /> Creators</h3>
                  <div className="flex flex-col gap-2">{results.users.map(userRow)}</div>
                </section>
              )}
              {(tab === "top" || tab === "hashtags") && results.hashtags.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-vado-sub mb-2.5 flex items-center gap-1.5"><Hash size={13} /> Hashtags</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {results.hashtags.map((h) => (
                      <Link key={h.name} href={`/hashtag/${h.name}`} className="glass-soft rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-white/8 transition">
                        <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-vado-blue/30 to-vado-purple/30 flex items-center justify-center"><Hash size={17} className="text-vado-cyan" /></span>
                        <span>
                          <span className="block font-bold text-sm">#{h.name}</span>
                          <span className="block text-xs text-vado-sub">{formatCount(h.uses)} videos</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {(tab === "top" || tab === "sounds") && results.sounds.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-vado-sub mb-2.5 flex items-center gap-1.5"><Music2 size={13} /> Sounds</h3>
                  <div className="flex flex-col gap-2">
                    {results.sounds.map((s) => (
                      <Link key={s.title} href={`/video/${s.sampleVideoId}`} className="glass-soft rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-white/8 transition">
                        <span className="w-10 h-10 rounded-full ring-grad flex items-center justify-center spin-slow"><Music2 size={16} className="text-white" /></span>
                        <span className="flex-1 min-w-0">
                          <span className="block font-bold text-sm truncate">{s.title}</span>
                          <span className="block text-xs text-vado-sub">{s.uses} video{s.uses === 1 ? "" : "s"}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
              {(tab === "top" || tab === "videos") && results.videos.length > 0 && (
                <section>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-vado-sub mb-2.5">Videos</h3>
                  <VideoGrid videos={results.videos} />
                </section>
              )}
              {results.users.length === 0 && results.videos.length === 0 && results.hashtags.length === 0 && results.sounds.length === 0 && (
                <EmptyState icon={Search} title={`No results for “${query}”`} sub="Try a different spelling, or explore what's trending below." />
              )}
            </div>
          ) : null}
        </div>
      ) : (
        /* Default discovery */
        <div className="mt-7 flex flex-col gap-9">
          {recent.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-vado-sub flex items-center gap-1.5"><Clock size={13} /> Recent searches</h3>
                <button onClick={() => { setRecent([]); writeLocal("vado_recent_searches", []); }} className="text-[11px] font-semibold text-vado-sub hover:text-vado-danger transition">Clear</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button key={r} onClick={() => submit(r)} className="glass-soft rounded-full px-3.5 py-1.5 text-xs font-semibold hover:bg-white/10 transition">
                    {r}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h3 className="text-lg font-extrabold flex items-center gap-2 mb-4"><Flame size={18} className="text-vado-danger" /> Trending hashtags</h3>
            {trending === null ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[...Array(6)].map((_, i) => <div key={i} className="h-28 rounded-2xl shimmer" />)}
              </div>
            ) : trending.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No trends yet" sub="Hashtags will start trending as creators post." />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {trending.map((t, i) => (
                  <motion.div key={t.name} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                    <Link href={`/hashtag/${t.name}`} className="relative block h-28 rounded-2xl overflow-hidden border border-white/10 group">
                      {t.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition duration-500" loading="lazy" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-vado-blue/30 to-vado-purple/30" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#05070f]/95 via-[#05070f]/45 to-transparent" />
                      <span className="absolute top-2.5 left-3 text-2xl font-black text-grad">#{i + 1}</span>
                      <div className="absolute bottom-2.5 left-3 right-3">
                        <p className="font-extrabold text-sm truncate">#{t.name}</p>
                        <p className="text-[10px] text-vado-sub font-semibold">
                          {formatCount(t.total)} videos{t.recent > 0 && <span className="text-vado-success"> · +{t.recent} this week</span>}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          <section>
            <h3 className="text-lg font-extrabold mb-4">Explore categories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {cats.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => void openCategory(c)}
                  className="glass rounded-2xl px-4 py-4 text-left hover:border-white/25 transition group relative overflow-hidden"
                >
                  <span className="absolute -top-8 -right-8 w-20 h-20 rounded-full blur-2xl opacity-40 group-hover:opacity-70 transition" style={{ background: c.hue }} />
                  <span className="w-2.5 h-2.5 rounded-full block mb-2.5" style={{ background: c.hue }} />
                  <span className="block font-bold text-sm">{c.name}</span>
                  <span className="block text-[11px] text-vado-sub mt-0.5">{c.videos} videos · {formatCount(c.views)} views</span>
                </button>
              ))}
            </div>
          </section>

          {creators.length > 0 && (
            <section>
              <h3 className="text-lg font-extrabold mb-4">Creators to follow</h3>
              <div className="flex flex-col gap-2">{creators.map((c) => userRow({ ...c, bio: "" }))}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
