import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, ChevronLeft, Plus, Target, Trash2 } from 'lucide-react';
import { DEFAULT_GOALS, INTERESTS, type OnboardingGoal } from '../data/mock';
import { load, save } from '../lib/store';
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

  const [goals, setGoals] = useState<OnboardingGoal[]>(() => load<OnboardingGoal[]>('goals', DEFAULT_GOALS));
  const [goalDraft, setGoalDraft] = useState('');

  const finish = () => {
    localStorage.setItem('vado.interests', JSON.stringify(picked));
    save('goals', goals);
    toast(picked.length ? `Saving ${picked.length} interests…` : 'Skipping interests…');
    onDone(picked);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 px-4 pb-3 pt-4">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between">
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
        <div className="mx-auto w-full max-w-3xl">
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

        <ul className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
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

        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: reduce ? 0 : 0.25 }}
          className="mt-8 rounded-3xl border border-[#d8f3ff]/25 bg-glass p-4 backdrop-blur-lg"
        >
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
            <Target size={13} /> Your goals with VADO
          </p>
          <p className="mt-1 text-[12px] text-mist">Personalized from your picks — edit or clear them, any time in Settings.</p>
          <ul className="mt-3 space-y-1.5">
            {goals.map((g) => (
              <li key={g.id} className="flex items-center gap-2.5">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={g.done}
                  aria-label={`Goal: ${g.text}`}
                  onClick={() => setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)))}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    g.done ? 'border-beam bg-volt/50 text-white' : 'border-[#d8f3ff]/40 bg-white/5 text-transparent'
                  }`}
                >
                  <Check size={12} />
                </button>
                <input
                  value={g.text}
                  onChange={(e) => setGoals((gs) => gs.map((x) => (x.id === g.id ? { ...x, text: e.target.value.slice(0, 80) } : x)))}
                  aria-label="Goal text"
                  className={`min-w-0 flex-1 rounded-lg border border-transparent bg-transparent px-1.5 py-1 text-[13px] outline-none focus:border-beam/60 ${
                    g.done ? 'text-mist line-through' : 'text-ink'
                  }`}
                />
                <button
                  type="button"
                  aria-label={`Remove goal ${g.text}`}
                  onClick={() => setGoals((gs) => gs.filter((x) => x.id !== g.id))}
                  className="rounded-full p-1.5 text-mist transition-colors hover:text-red-300"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = goalDraft.trim();
              if (!text) return;
              setGoals((gs) => [...gs, { id: `goal${Date.now()}`, text: text.slice(0, 80), done: false }]);
              setGoalDraft('');
            }}
            className="mt-2.5 flex gap-2"
          >
            <input
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              placeholder="Add your own goal…"
              aria-label="New goal"
              className="min-w-0 flex-1 rounded-full border border-[#d8f3ff]/30 bg-deep px-3.5 py-2 text-[12px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
            />
            <button
              type="submit"
              disabled={!goalDraft.trim()}
              aria-label="Add goal"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-volt to-beam text-white shadow-glow disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </form>
        </motion.div>
        </div>
      </div>

      <div className="shrink-0 px-4 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          <button
            type="button"
            onClick={finish}
            className="w-full rounded-full border border-[#d8f3ff] bg-volt/15 py-3 text-[16px] font-medium text-white shadow-glow shadow-glow-in transition-colors hover:bg-volt/30"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
