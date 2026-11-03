import { motion, useReducedMotion } from 'framer-motion';
import { Banknote, CalendarDays, CalendarHeart, ChevronRight, Eye, FlaskConical, Handshake, Layers, Package, Radio, ShieldCheck, Target, TrendingUp, UserPlus, Users, UsersRound, Wallet } from 'lucide-react';
import { DEFAULT_COINS, DEFAULT_GOALS, fmt, type OnboardingGoal } from '../data/mock';
import { load } from '../lib/store';
import { GLOBAL_VIBES, analyticsSeries } from '../data/mock';
import { LineChart } from '../components/charts';

const STATS = [
  { label: 'Vibes viewed', value: '128' },
  { label: 'Saved', value: String(load<string[]>('saved', []).length || 24) },
  { label: 'Following', value: String(load<string[]>('following', []).length || 16) },
];

const TOOLS = [
  { k: 'analytics', label: 'Analytics', desc: 'Reach, engagement and top vibes', icon: <TrendingUp size={18} /> },
  { k: 'rewards', label: 'Rewards & payouts', desc: 'Campaigns and demo coins', icon: <Banknote size={18} /> },
  { k: 'referrals', label: 'Referrals', desc: 'Invite friends, unlock tiers', icon: <UserPlus size={18} /> },
  { k: 'mood', label: 'Mood Timeline', desc: 'Private check-ins and AI reflections', icon: <CalendarHeart size={18} /> },
  { k: 'collections', label: 'Collections', desc: 'Mood boards — private, public or collab', icon: <Layers size={18} /> },
  { k: 'circles', label: 'Community Circles', desc: 'Private groups, roles, events and moderation', icon: <UsersRound size={18} /> },
  { k: 'collab', label: 'Collaborative Vibes', desc: 'Shared boards with roles and revisions', icon: <Users size={18} /> },
  { k: 'market', label: 'Collab Marketplace', desc: 'Briefs, roles and AI creator matching', icon: <Handshake size={18} /> },
  { k: 'events', label: 'Events & Drops', desc: 'RSVP to live drops and workshops', icon: <CalendarDays size={18} /> },
  { k: 'subs', label: 'Support a creator', desc: 'Demo-coin tiers, cancel anytime', icon: <Wallet size={18} /> },
  { k: 'dmarket', label: 'Digital marketplace', desc: 'LUTs, sound kits and presets', icon: <Package size={18} /> },
  { k: 'live', label: 'Live now', desc: 'Rooms, chat and demo gifts', icon: <Radio size={18} /> },
  { k: 'safety', label: 'Safety Center', desc: 'Guidelines, controls, reports and AI transparency', icon: <ShieldCheck size={18} /> },
  { k: 'admin', label: 'Experimentation lab', desc: 'Feature flags and A/B buckets (demo)', icon: <FlaskConical size={18} /> },
] as const;

export function ViewsScreen({
  onExplore,
  onOpenTool,
  onOpenSettings,
}: {
  onExplore: () => void;
  onOpenTool: (tool: 'analytics' | 'rewards' | 'referrals' | 'mood' | 'collections' | 'circles' | 'collab' | 'market' | 'events' | 'subs' | 'dmarket' | 'live' | 'safety' | 'admin') => void;
  onOpenSettings: () => void;
}) {
  const reduce = useReducedMotion();
  const coins = load<number>('coins', DEFAULT_COINS);
  const goals = load<OnboardingGoal[]>('goals', DEFAULT_GOALS);
  const goalsDone = goals.filter((g) => g.done).length;
  const trend = analyticsSeries(21).map((p) => p.views);
  const weekViews = trend.reduce((a, b) => a + b, 0);

  return (
    <div className="scroll-slim h-full w-full overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="flex items-center gap-3">
          <motion.span
            initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35 }}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-beam/30 bg-volt/10 text-beam shadow-glow"
          >
            <Eye size={22} />
          </motion.span>
          <div>
            <h2 className="text-xl font-semibold text-ink">Your views</h2>
            <p className="text-[12px] text-mist">Saved vibes, creator tools and demo earnings — all on this device.</p>
          </div>
        </div>

        <ul className="mt-6 grid grid-cols-3 gap-3">
          {STATS.map((s, i) => (
            <motion.li
              key={s.label}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.1 + i * 0.06 }}
              className="rounded-2xl border border-[#d8f3ff]/25 bg-glass px-2 py-4 text-center backdrop-blur-lg"
            >
              <p className="text-xl font-semibold text-ink sm:text-2xl">{s.value}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-wide text-mist">{s.label}</p>
            </motion.li>
          ))}
        </ul>

        <motion.section
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.25 }}
          className="mt-5 rounded-3xl border border-[#d8f3ff]/25 bg-glass p-4 backdrop-blur-lg"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Last 3 weeks</h3>
            <span className="text-[12px] text-mist">{fmt(weekViews)} views · {coins.toLocaleString()} demo coins</span>
          </div>
          <LineChart points={trend} height={110} label="Views over the last 21 days" />
          <p className="mt-1 text-[11px] text-mist">
            {GLOBAL_VIBES.length} public vibes in circulation · figures are simulated demo data
          </p>
        </motion.section>

        <div className="mt-5 space-y-2.5">
          {TOOLS.map((t, i) => (
            <motion.button
              key={t.k}
              type="button"
              onClick={() => onOpenTool(t.k)}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : 0.3 + i * 0.06 }}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-4 py-3.5 text-left backdrop-blur-lg transition-colors hover:border-beam/60"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-beam/30 bg-volt/10 text-beam">
                {t.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-ink">{t.label}</span>
                <span className="block text-[12px] text-mist">{t.desc}</span>
              </span>
              <ChevronRight size={16} className="shrink-0 text-mist" />
            </motion.button>
          ))}
          <motion.button
            type="button"
            onClick={onOpenSettings}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.3 + TOOLS.length * 0.06 }}
            className="flex w-full items-center gap-3.5 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-4 py-3.5 text-left backdrop-blur-lg transition-colors hover:border-beam/60"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-beam/30 bg-volt/10 text-beam">
              <Target size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14px] font-semibold text-ink">Your goals</span>
              <span className="block text-[12px] text-mist">{goalsDone} of {goals.length} done · edit in Settings</span>
            </span>
            <ChevronRight size={16} className="shrink-0 text-mist" />
          </motion.button>
        </div>

        <button
          type="button"
          onClick={onExplore}
          className="mt-6 w-full max-w-xs rounded-full border border-[#d8f3ff] bg-volt/15 py-3 text-[15px] font-medium text-white shadow-glow shadow-glow-in transition-colors hover:bg-volt/30 sm:min-w-[280px]"
        >
          Explore Global
        </button>
      </div>
    </div>
  );
}
