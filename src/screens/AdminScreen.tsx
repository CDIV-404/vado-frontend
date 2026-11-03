import { useState } from 'react';
import { FlaskConical, Beaker, RotateCcw } from 'lucide-react';
import { EXPERIMENTS, FEATURE_FLAGS } from '../data/mock';
import { flagOn, forceVariant, onVariant, setFlag } from '../lib/flags';
import { remove } from '../lib/store';
import { useToast } from '../components/Toast';
import { ConfirmModal, ScreenOverlay, SectionCard } from '../components/ui';

const STATUS_TONE: Record<string, string> = {
  running: 'border-beam/40 bg-volt/10 text-beam',
  ramping: 'border-amber-300/40 bg-amber-400/10 text-amber-200',
  stopped: 'border-[#d8f3ff]/25 bg-white/5 text-mist',
};

export function AdminScreen({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [, force] = useState(0);
  const rerender = () => force((n) => n + 1);
  const [confirmReset, setConfirmReset] = useState(false);

  const onCount = FEATURE_FLAGS.filter((f) => flagOn(f.id)).length;

  return (
    <ScreenOverlay title="Experimentation lab" onClose={onClose}>
      <div className="rounded-3xl border border-beam/40 bg-gradient-to-br from-volt/25 to-transparent p-5">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-beam">
          <FlaskConical size={13} /> Feature flags & A/B
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink">
          A demo of how VADO ships experiments. Flags and variant buckets are stored on this device only — nothing is sent to a server and no real user is tracked.
        </p>
      </div>

      <SectionCard title={`Feature flags · ${onCount} on`} className="mt-4">
        <ul className="space-y-2.5">
          {FEATURE_FLAGS.map((f) => {
            const on = flagOn(f.id);
            return (
              <li key={f.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#d8f3ff]/20 bg-white/5 px-3.5 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-ink">{f.label}</span>
                  <span className="block text-[11px] text-mist">{f.desc}</span>
                </span>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${on ? 'text-beam' : 'text-mist'}`}>
                  {on ? 'On' : 'Off'}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`Toggle ${f.label}`}
                  onClick={() => {
                    setFlag(f.id, !on);
                    rerender();
                    toast(`${f.label} ${!on ? 'enabled' : 'disabled'}`);
                  }}
                  className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
                    on ? 'border-beam bg-volt/60 shadow-glow-in' : 'border-[#d8f3ff]/30 bg-white/10'
                  }`}
                >
                  <span
                    className={`absolute top-[3px] rounded-full bg-white transition-all ${on ? 'left-[23px]' : 'left-[3px]'}`}
                    style={{ height: 18, width: 18 }}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Active experiments" className="mt-4">
        <ul className="space-y-3">
          {EXPERIMENTS.map((exp) => {
            const variant = onVariant(exp);
            return (
              <li key={exp.id} className="rounded-2xl border border-[#d8f3ff]/20 bg-white/5 p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold text-ink">{exp.name}</p>
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_TONE[exp.status]}`}>
                    {exp.status}
                  </span>
                </div>
                <p className="mt-1 text-[12px] leading-relaxed text-mist">{exp.hypothesis}</p>
                <p className="mt-2 text-[11px] text-sky">Rollout {exp.rollout}%</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {exp.variants.map((v) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={variant === v}
                      onClick={() => {
                        forceVariant(exp.id, v);
                        rerender();
                        toast(`${exp.name} → ${v}`);
                      }}
                      className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                        variant === v ? 'border-beam bg-volt/25 text-white' : 'border-[#d8f3ff]/25 bg-glass text-mist hover:text-ink'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                  <span className="ml-auto text-[11px] text-mist">
                    {variant ? `You see: ${variant}` : exp.status === 'stopped' ? 'Not assigned' : 'Outside your bucket'}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Lab data" className="mt-4">
        <p className="text-[12px] leading-relaxed text-mist">
          Flags, your device bucket id and any variant overrides live in this browser. Resetting returns every experiment to its default assignment.
        </p>
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff]/40 bg-volt/15 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-volt/30"
        >
          <RotateCcw size={13} /> Reset lab to defaults
        </button>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] text-mist">
          <Beaker size={12} className="text-beam" /> Simulated cohort — no real participant data.
        </p>
      </SectionCard>

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          remove('featureFlags');
          remove('expVariant');
          remove('deviceId');
          rerender();
          toast('Lab reset to defaults');
        }}
        title="Reset the lab?"
        body="All local flag toggles and variant overrides will return to their built-in defaults."
        confirmLabel="Reset lab"
        danger
      />
    </ScreenOverlay>
  );
}
