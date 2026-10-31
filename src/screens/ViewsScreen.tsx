import { motion, useReducedMotion } from 'framer-motion';
import { Eye } from 'lucide-react';

const STATS = [
  { label: 'Vibes viewed', value: '128' },
  { label: 'Saved', value: '24' },
  { label: 'Following', value: '16' },
];

export function ViewsScreen({ onExplore }: { onExplore: () => void }) {
  const reduce = useReducedMotion();
  return (
    <div className="flex h-full flex-col items-center px-6 pt-14 text-center">
      <motion.span
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-beam/30 bg-volt/10 text-beam shadow-glow"
      >
        <Eye size={28} />
      </motion.span>
      <h2 className="text-xl font-semibold text-ink">Your views</h2>
      <p className="mt-1.5 max-w-[240px] text-[13px] leading-relaxed text-mist">
        Vibes you watch or save will collect here so you can pick up where you left off.
      </p>

      <ul className="mt-8 grid w-full grid-cols-3 gap-2.5">
        {STATS.map((s, i) => (
          <motion.li
            key={s.label}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.1 + i * 0.06 }}
            className="rounded-2xl border border-[#d8f3ff]/25 bg-glass px-2 py-3 backdrop-blur-lg"
          >
            <p className="text-lg font-semibold text-ink">{s.value}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-mist">{s.label}</p>
          </motion.li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onExplore}
        className="mt-9 w-full max-w-[240px] rounded-full border border-[#d8f3ff] bg-volt/15 py-3 text-[16px] font-medium text-white shadow-glow shadow-glow-in transition-colors hover:bg-volt/30"
      >
        Explore Global
      </button>
    </div>
  );
}
