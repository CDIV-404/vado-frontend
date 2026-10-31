import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft } from 'lucide-react';
import { INTERESTS } from '../data/mock';
import { useToast } from '../components/Toast';

export function StudioOnboarding({
  onDone,
  onBack,
}: {
  onDone: (picked: string[]) => void;
  onBack: () => void;
}) {
  const reduce = useReducedMotion();
  const toast = useToast();
  const [picked, setPicked] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('vado.interests') ?? '[]');
    } catch {
      return [];
    }
  });

  const toggle = (label: string) =>
    setPicked((p) => (p.includes(label) ? p.filter((x) => x !== label) : [...p, label]));

  const finish = () => {
    localStorage.setItem('vado.interests', JSON.stringify(picked));
    toast(picked.length ? `Saving ${picked.length} interests…` : 'Skipping interests…');
    onDone(picked);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 px-4 pb-3 pt-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-0.5 text-[13px] text-mist transition-colors hover:text-ink"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <span className="text-[12px] font-bold tracking-[0.28em] text-ink">VADO</span>
          <button
            type="button"
            onClick={() => {
              toast('Onboarding skipped');
              onDone(picked);
            }}
            className="text-[13px] font-medium text-beam transition-colors hover:text-ink"
          >
            Skip
          </button>
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-beam/60 to-transparent shadow-glow" />
      </header>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <motion.h2
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-4 text-[26px] font-semibold leading-tight text-ink"
        >
          Pick your
          <br />
          interests
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduce ? 0 : 0.1 }}
          className="mt-1.5 text-[13px] text-mist"
        >
          This helps us show you more of what you like
        </motion.p>

        <ul className="mt-5 grid grid-cols-2 gap-2.5">
          {INTERESTS.map((it, i) => {
            const on = picked.includes(it.label);
            return (
              <motion.li
                key={it.label}
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.85, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.05 + i * 0.035, type: 'spring', stiffness: 320, damping: 22 }}
              >
                <button
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(it.label)}
                  className={`flex w-full items-center gap-1.5 rounded-full border px-3 py-2.5 text-left text-[12px] transition-all duration-150 ${
                    on
                      ? 'border-beam/80 bg-gradient-to-r from-volt/60 to-beam/40 text-white shadow-glow'
                      : 'border-[#d8f3ff]/20 bg-white/5 text-mist hover:border-beam/40 hover:text-ink'
                  }`}
                >
                  <span aria-hidden="true">{it.emoji}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{it.label}</span>
                  {on && <Check size={14} className="shrink-0 text-white" aria-hidden="true" />}
                </button>
              </motion.li>
            );
          })}
        </ul>
      </div>

      <div className="shrink-0 px-4 pb-4">
        <button
          type="button"
          onClick={finish}
          className="w-full rounded-full border border-[#d8f3ff] bg-volt/15 py-3 text-[16px] font-medium text-white shadow-glow shadow-glow-in transition-colors hover:bg-volt/30"
        >
          Next
        </button>
      </div>
    </div>
  );
}
