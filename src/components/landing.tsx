"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Heart, MessageCircle, Bookmark, Share2, Sparkles, Clapperboard, ShieldCheck,
  Play, ArrowRight, Hash, Music2, Compass,
} from "lucide-react";
import { Atmosphere } from "@/components/shell";
import { Avatar, Logo, LogoMark } from "@/components/ui";
import { formatCount } from "@/lib/format";
import type { VideoDTO } from "@/lib/types";

type Creator = { username: string; displayName: string; avatarUrl: string | null; followers: number; videos: number };

const fade = {
  hidden: { opacity: 0, y: 26 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.09, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const } }),
};

export function Landing({
  stats, tags, creators, hero,
}: {
  stats: { creators: number; videos: number; likes: number };
  tags: string[];
  creators: Creator[];
  hero: VideoDTO | null;
}) {
  return (
    <div className="relative min-h-dvh overflow-x-clip">
      <Atmosphere />
      <div className="pointer-events-none absolute -top-32 -left-32 w-[34rem] h-[34rem] aurora-blob bg-vado-blue/25" />
      <div className="pointer-events-none absolute top-40 -right-40 w-[30rem] h-[30rem] aurora-blob bg-vado-purple/25" style={{ animationDelay: "-6s" }} />
      <div className="pointer-events-none absolute top-[60rem] left-1/4 w-[26rem] h-[26rem] aurora-blob bg-vado-cyan/15" style={{ animationDelay: "-12s" }} />

      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 px-4 pt-4">
        <div className="glass max-w-6xl mx-auto rounded-2xl px-5 py-3 flex items-center justify-between">
          <Link href="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-vado-sub">
            <a href="#features" className="hover:text-vado-text transition">Why VADO</a>
            <a href="#trending" className="hover:text-vado-text transition">Trending</a>
            <a href="#creators" className="hover:text-vado-text transition">Creators</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/auth" className="glass-soft rounded-xl px-4 py-2 text-sm font-bold hover:bg-white/10 transition">
              Sign in
            </Link>
            <Link href="/auth?mode=register" className="btn-primary rounded-xl px-4 py-2 text-sm font-bold text-white">
              Create account
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-5 pt-32 md:pt-40 pb-16 grid lg:grid-cols-2 gap-14 items-center">
        <div>
          <motion.div variants={fade} initial="hidden" animate="show" custom={0}
            className="glass-soft rounded-full px-4 py-1.5 inline-flex items-center gap-2 text-xs font-bold text-vado-cyan mb-6">
            <Sparkles size={13} /> The short-form network, wrapped in glass
          </motion.div>
          <motion.h1 variants={fade} initial="hidden" animate="show" custom={1}
            className="text-5xl md:text-6xl xl:text-7xl font-extrabold leading-[1.04] tracking-tight">
            Scroll into<br />
            <span className="text-grad">another dimension.</span>
          </motion.h1>
          <motion.p variants={fade} initial="hidden" animate="show" custom={2}
            className="text-vado-sub text-lg leading-relaxed mt-6 max-w-md">
            VADO is where short video meets a futuristic glass universe. A feed tuned to your taste,
            creators worth following, and a studio that publishes in seconds.
          </motion.p>
          <motion.div variants={fade} initial="hidden" animate="show" custom={3} className="flex flex-wrap items-center gap-3 mt-8">
            <Link href="/feed" className="btn-primary rounded-2xl px-6 py-3.5 font-bold text-white flex items-center gap-2">
              <Play size={17} fill="white" /> Start watching — it&apos;s open
            </Link>
            <Link href="/auth?mode=register" className="glass rounded-2xl px-6 py-3.5 font-bold hover:bg-white/10 transition flex items-center gap-2">
              Create account <ArrowRight size={16} className="text-vado-cyan" />
            </Link>
          </motion.div>
          <motion.p variants={fade} initial="hidden" animate="show" custom={4} className="text-xs text-vado-sub/70 mt-3">
            No account needed to browse. Sign in only when you want to like, follow or post.
          </motion.p>
          <motion.div variants={fade} initial="hidden" animate="show" custom={5} className="grid grid-cols-3 gap-3 mt-10 max-w-md">
            {[
              { n: stats.creators, label: "creators" },
              { n: stats.videos, label: "videos live" },
              { n: stats.likes, label: "likes exchanged" },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl px-4 py-3.5 text-center">
                <div className="text-2xl font-extrabold text-grad">{formatCount(s.n)}</div>
                <div className="text-[11px] text-vado-sub font-semibold mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Phone mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40, rotate: 3 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto"
        >
          <div className="absolute inset-0 -m-10 rounded-full bg-gradient-to-br from-vado-blue/30 via-transparent to-vado-purple/30 blur-3xl" />
          <div className="relative glass rounded-[3rem] p-2.5 shadow-[0_40px_120px_rgba(3,6,20,0.8)]">
            <div className="relative w-[280px] md:w-[310px] aspect-[9/18.5] rounded-[2.4rem] overflow-hidden bg-vado-bg2">
              {hero ? (
                <video
                  src={hero.videoUrl}
                  poster={hero.thumbnailUrl ?? undefined}
                  autoPlay muted loop playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-vado-bg2 to-vado-bg">
                  <LogoMark size={72} />
                </div>
              )}
              <div className="absolute inset-0 video-scrim" />
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-5 rounded-full bg-black/70 backdrop-blur" />
              {hero && (
                <>
                  <div className="absolute right-2.5 bottom-24 flex flex-col items-center gap-3.5">
                    {[
                      { icon: <Heart size={20} fill="#FF5C7A" className="text-[#FF5C7A]" />, n: hero.counts.likes },
                      { icon: <MessageCircle size={19} />, n: hero.counts.comments },
                      { icon: <Bookmark size={19} fill="#FFC24B" className="text-[#FFC24B]" />, n: hero.counts.saves },
                      { icon: <Share2 size={18} />, n: hero.counts.shares },
                    ].map((x, i) => (
                      <span key={i} className="flex flex-col items-center gap-0.5">
                        <span className="glass-deep w-10 h-10 rounded-full flex items-center justify-center">{x.icon}</span>
                        <span className="text-[10px] font-bold">{formatCount(x.n)}</span>
                      </span>
                    ))}
                  </div>
                  <div className="absolute left-3.5 right-16 bottom-6">
                    <p className="font-extrabold text-sm">@{hero.author.username}</p>
                    <p className="text-xs text-white/90 mt-1 line-clamp-2">{hero.caption}</p>
                    <p className="text-[10px] text-white/70 mt-1.5 flex items-center gap-1"><Music2 size={10} /> {hero.soundTitle}</p>
                  </div>
                </>
              )}
            </div>
          </div>
          <motion.div
            className="absolute -left-16 top-24 glass-deep rounded-2xl px-4 py-3 floaty hidden sm:flex items-center gap-2.5"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          >
            <span className="w-8 h-8 rounded-full bg-[#FF5C7A]/20 flex items-center justify-center">
              <Heart size={15} fill="#FF5C7A" className="text-[#FF5C7A]" />
            </span>
            <span className="text-xs font-bold">{formatCount(stats.likes)} likes<br /><span className="text-vado-sub font-medium">and counting</span></span>
          </motion.div>
          <motion.div
            className="absolute -right-12 bottom-32 glass-deep rounded-2xl px-4 py-3 floaty hidden sm:flex items-center gap-2.5"
            style={{ animationDelay: "-3s" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          >
            <span className="w-8 h-8 rounded-full bg-vado-cyan/20 flex items-center justify-center">
              <Hash size={15} className="text-vado-cyan" />
            </span>
            <span className="text-xs font-bold">{tags[0] ? `#${tags[0]}` : "#vado"}<br /><span className="text-vado-sub font-medium">trending now</span></span>
          </motion.div>
        </motion.div>
      </section>

      {/* Trending marquee */}
      {tags.length > 0 && (
        <section id="trending" className="py-8 border-y border-white/8 bg-white/[0.02] overflow-hidden">
          <div className="flex whitespace-nowrap marquee w-max">
            {[...tags, ...tags].map((t, i) => (
              <Link key={i} href={`/hashtag/${t}`} className="mx-5 text-lg font-extrabold text-vado-sub/60 hover:text-vado-cyan transition inline-flex items-center gap-1">
                <span className="text-vado-blue">#</span>{t}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-5 py-24">
        <motion.h2
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }}
          className="text-3xl md:text-4xl font-extrabold text-center"
        >
          Built for the <span className="text-grad">feed generation</span>
        </motion.h2>
        <p className="text-vado-sub text-center mt-3 max-w-lg mx-auto">Everything a short-video network needs — honest ranking, real community tools, zero clutter.</p>
        <div className="grid md:grid-cols-3 gap-5 mt-12">
          {[
            {
              icon: Sparkles, hue: "text-vado-cyan", glow: "from-vado-cyan/20",
              title: "A feed that learns you",
              body: "For You blends your interests, watch time and completions with fresh uploads. Transparent heuristics today — smarter ranking as the community grows.",
            },
            {
              icon: Clapperboard, hue: "text-vado-purple", glow: "from-vado-purple/20",
              title: "A studio in your pocket",
              body: "Record with your camera or upload from disk, pick a cover frame, tag it, choose who sees it, and publish — or keep it in drafts.",
            },
            {
              icon: ShieldCheck, hue: "text-vado-success", glow: "from-vado-success/20",
              title: "Moderated & yours",
              body: "Report content, block accounts, keep likes private. A real moderation desk reviews every report and logs every decision.",
            },
          ].map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }}
              transition={{ delay: i * 0.12 }}
              className="glass rounded-3xl p-7 relative overflow-hidden group hover:border-white/25 transition"
            >
              <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${f.glow} to-transparent blur-2xl group-hover:scale-125 transition duration-500`} />
              <span className="glass-soft w-12 h-12 rounded-2xl flex items-center justify-center mb-5">
                <f.icon size={22} className={f.hue} />
              </span>
              <h3 className="font-extrabold text-lg">{f.title}</h3>
              <p className="text-sm text-vado-sub leading-relaxed mt-2.5">{f.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Creators */}
      {creators.length > 0 && (
        <section id="creators" className="max-w-6xl mx-auto px-5 pb-24">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex items-end justify-between mb-8">
            <div>
              <h2 className="text-3xl font-extrabold">Faces of the <span className="text-grad">feed</span></h2>
              <p className="text-vado-sub mt-2">Real creators, already posting.</p>
            </div>
            <Link href="/discover" className="glass-soft rounded-xl px-4 py-2 text-sm font-bold hover:bg-white/10 transition hidden sm:flex items-center gap-2">
              <Compass size={15} className="text-vado-cyan" /> Discover all
            </Link>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {creators.map((c, i) => (
              <motion.div key={c.username} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Link href={`/profile/${c.username}`} className="glass rounded-3xl p-6 flex flex-col items-center text-center hover:border-vado-blue/40 hover:shadow-[0_0_40px_rgba(40,124,255,0.15)] transition block">
                  <Avatar src={c.avatarUrl} name={c.displayName} size={72} ring />
                  <p className="font-extrabold mt-4">{c.displayName}</p>
                  <p className="text-xs text-vado-sub">@{c.username}</p>
                  <p className="text-xs font-bold text-vado-cyan mt-3">
                    {formatCount(c.followers)} followers · {c.videos} videos
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-5 pb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          className="relative glass rounded-[2.5rem] px-8 py-14 text-center overflow-hidden"
        >
          <div className="absolute -top-24 left-1/4 w-72 h-72 rounded-full bg-vado-blue/25 blur-3xl" />
          <div className="absolute -bottom-24 right-1/4 w-72 h-72 rounded-full bg-vado-purple/25 blur-3xl" />
          <h2 className="relative text-3xl md:text-4xl font-extrabold">Your first scroll is <span className="text-grad">on us.</span></h2>
          <p className="relative text-vado-sub mt-3">Jump straight in as a guest — claim your @handle whenever you&apos;re ready.</p>
          <div className="relative flex flex-wrap justify-center gap-3 mt-8">
            <Link href="/feed" className="btn-primary rounded-2xl px-7 py-3.5 font-bold text-white">Open the feed</Link>
            <Link href="/auth?mode=register" className="glass rounded-2xl px-7 py-3.5 font-bold hover:bg-white/10 transition">Claim your handle</Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-white/8 py-10">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size={24} />
          <p className="text-xs text-vado-sub/70">© 2026 VADO · Short-form video, another dimension.</p>
          <div className="flex gap-5 text-xs font-semibold text-vado-sub">
            <Link href="/discover" className="hover:text-vado-text transition">Discover</Link>
            <Link href="/create" className="hover:text-vado-text transition">Create</Link>
            <Link href="/auth" className="hover:text-vado-text transition">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
