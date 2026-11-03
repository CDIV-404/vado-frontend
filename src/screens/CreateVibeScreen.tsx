import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Globe2, Hash, Sparkles, X } from 'lucide-react';
import { CATEGORIES, GLOBAL_VIBES, GRADIENTS, LANGUAGES, MOODS, type Vibe } from '../data/mock';
import { load, save } from '../lib/store';
import { vadoReply } from '../lib/ai';
import { useToast } from '../components/Toast';
import { Chip, ConfirmModal } from '../components/ui';

type Visibility = 'public' | 'followers' | 'private';

export function CreateVibeScreen({
  seed,
  session,
  onPublish,
  onClose,
}: {
  seed?: string;
  session: string | null;
  onPublish: (vibe: Vibe) => void;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [mood, setMood] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [caption, setCaption] = useState(seed ?? '');
  const [hashtag, setHashtag] = useState<string | null>(null);
  const [language, setLanguage] = useState('en');
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [allowRemix, setAllowRemix] = useState(true);
  const [asked, setAsked] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const gradient = useMemo(() => {
    const mc = MOODS.find((m) => m.label === mood)?.color;
    if (mc) return `linear-gradient(135deg,#07192b,${mc})`;
    return GRADIENTS[0];
  }, [mood]);

  const suggestions = asked ? vadoReply(`Give me a caption for this ${mood ?? 'vibe'} mood.`) : null;

  const hashtags = hashtag ? [hashtag] : [];
  const translations = useMemo(() => {
    if (!autoTranslate) return undefined;
    const target = LANGUAGES.filter((l) => l.code !== language).slice(0, 3);
    return Object.fromEntries(target.map((l) => [l.code, `[${l.label}] ${caption}`]));
  }, [autoTranslate, language, caption]);

  const canNext = [true, mood !== null && caption.trim() !== '', visibility !== null, true][step];

  const publish = () => {
    const name = session ?? 'You';
    const vibe: Vibe = {
      id: `my-${Date.now()}`,
      creator: name,
      handle: `@${name.toLowerCase().replace(/\s+/g, '.')}`,
      caption: caption.trim(),
      gradient,
      category: category ?? 'Art',
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      time: 'now',
      mood: mood ?? 'Calm',
      hashtags,
      format: 'visual',
      mine: true,
      visibility,
      language,
      translations,
      allowRemix,
    };
    const prev = load<Vibe[]>('myVibes', []);
    save('myVibes', [vibe, ...prev]);
    onPublish(vibe);
    toast('Your Vibe is live');
    onClose();
  };

  const tryClose = () => {
    if (caption.trim() || mood || category) setConfirmClose(true);
    else onClose();
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') tryClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  });

  const steps = ['Mood', 'Create', 'Visibility', 'Publish'];

  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-40 flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Create a Vibe"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={tryClose} aria-hidden="true" />
      <div className="relative mt-2 flex h-[calc(100%-8px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#d8f3ff]/35 bg-[#0a1f38]/95 shadow-glow-lg backdrop-blur-2xl">
        <header className="flex shrink-0 items-center gap-3 border-b border-[#d8f3ff]/15 px-4 py-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              aria-label="Back"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8f3ff]/25 bg-glass text-mist transition-colors hover:text-ink"
            >
              <ArrowLeft size={16} />
            </button>
          ) : (
            <span className="h-9 w-9" aria-hidden="true" />
          )}
          <div className="flex flex-1 items-center justify-center gap-1.5" aria-label={`Step ${step + 1} of 4: ${steps[step]}`}>
            {steps.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-8 bg-beam shadow-glow' : i < step ? 'w-4 bg-beam/40' : 'w-4 bg-[#d8f3ff]/20'
                }`}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={tryClose}
            aria-label="Close creator"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8f3ff]/25 bg-glass text-mist transition-colors hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>

        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-4">
          {step === 0 && (
            <section>
              <h2 className="text-[15px] font-semibold text-ink">What is the mood?</h2>
              <p className="mt-1 text-[12px] text-mist">Pick a mood — VADO AI will shape the palette and the caption.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {MOODS.map((m) => (
                  <Chip key={m.label} active={mood === m.label} onClick={() => setMood(mood === m.label ? null : m.label)}>
                    <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: m.color }} aria-hidden="true" />
                    {m.label}
                  </Chip>
                ))}
              </div>
              <h3 className="mb-2 mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Category</h3>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <Chip key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-4">
              <div>
                <label htmlFor="vibe-caption" className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
                  Caption
                </label>
                <textarea
                  id="vibe-caption"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  rows={3}
                  maxLength={200}
                  placeholder="Say it in one breath…"
                  className="w-full resize-none rounded-2xl border border-[#d8f3ff]/30 bg-volt/10 px-4 py-3 text-[14px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
                />
                <p className="mt-1 text-right text-[11px] text-mist">{caption.length}/200</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAsked(true);
                    if (suggestions) setCaption(suggestions.text.split('\n')[0].replace(/^“|”$/g, ''));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-beam/50 bg-volt/20 px-4 py-2 text-[12px] font-medium text-beam transition-colors hover:bg-volt/30"
                >
                  <Sparkles size={14} /> Suggest with VADO AI
                </button>
                {asked && suggestions && (
                  <button
                    type="button"
                    onClick={() => setCaption(suggestions.text.split('\n\n')[0].replace(/[“”]/g, '').trim())}
                    className="rounded-full border border-[#d8f3ff]/25 bg-glass px-4 py-2 text-[12px] text-mist transition-colors hover:text-ink"
                  >
                    Use AI caption
                  </button>
                )}
              </div>

              <div>
                <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
                  <Hash size={12} /> One tag
                </h3>
                <div className="flex flex-wrap gap-2">
                  {GLOBAL_VIBES.flatMap((v) => v.hashtags)
                    .filter((h, i, a) => a.indexOf(h) === i)
                    .slice(0, 8)
                    .map((h) => (
                      <Chip key={h} active={hashtag === h} onClick={() => setHashtag(hashtag === h ? null : h)}>
                        {h}
                      </Chip>
                    ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#d8f3ff]/25 bg-glass p-3">
                  <label htmlFor="vibe-lang" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
                    <Globe2 size={12} /> Language & region
                  </label>
                  <select
                    id="vibe-lang"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full rounded-xl border border-[#d8f3ff]/30 bg-deep px-3 py-2 text-[13px] text-ink outline-none focus:border-beam/70"
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        {l.native} ({l.label})
                      </option>
                    ))}
                  </select>
                  <label className="mt-3 flex items-center gap-2 text-[12px] text-mist">
                    <input
                      type="checkbox"
                      checked={autoTranslate}
                      onChange={(e) => setAutoTranslate(e.target.checked)}
                      className="h-4 w-4 accent-[#1687ff]"
                    />
                    Auto-translate into 3 more languages
                  </label>
                  {autoTranslate && translations && (
                    <ul className="mt-2 space-y-1 text-[11px] text-mist">
                      {Object.entries(translations).map(([code, text]) => (
                        <li key={code} className="truncate">{code}: {text}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <LivePreview gradient={gradient} caption={caption} mood={mood} hashtags={hashtags} />
              </div>
            </section>
          )}

          {step === 2 && (
            <section>
              <h2 className="text-[15px] font-semibold text-ink">Who can see it?</h2>
              <div className="mt-4 space-y-2.5">
                {(
                  [
                    { k: 'public', t: 'Public', d: 'Anyone on Global can find it.' },
                    { k: 'followers', t: 'Followers only', d: 'Shared with the people who follow you.' },
                    { k: 'private', t: 'Private', d: 'Just you. It never leaves your device.' },
                  ] as const
                ).map((o) => (
                  <button
                    key={o.k}
                    type="button"
                    onClick={() => setVisibility(o.k)}
                    aria-pressed={visibility === o.k}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors ${
                      visibility === o.k
                        ? 'border-beam bg-volt/20 shadow-glow-in'
                        : 'border-[#d8f3ff]/25 bg-glass hover:border-beam/50'
                    }`}
                  >
                    <p className="text-[14px] font-semibold text-ink">{o.t}</p>
                    <p className="mt-0.5 text-[12px] text-mist">{o.d}</p>
                  </button>
                ))}
              </div>
              <label className="mt-4 flex items-center gap-2.5 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-4 py-3 text-[13px] text-ink">
                <input
                  type="checkbox"
                  checked={allowRemix}
                  onChange={(e) => setAllowRemix(e.target.checked)}
                  className="h-4 w-4 accent-[#1687ff]"
                />
                <span>
                  Allow remixes of this Vibe
                  <span className="block text-[11px] text-mist">Remixers keep visible credit to you, always.</span>
                </span>
              </label>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-4">
              <h2 className="text-[15px] font-semibold text-ink">Final preview</h2>
              <div className="overflow-hidden rounded-3xl border border-[#d8f3ff]/25 bg-glass p-3.5">
                <div className="flex items-center gap-2.5">
                  <span className="h-9 w-9 rounded-full" style={{ background: gradient }} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">{session ?? 'You'}</p>
                    <p className="text-[11px] text-mist">now · {visibility === 'public' ? 'Public' : visibility === 'followers' ? 'Followers' : 'Private'}</p>
                  </div>
                  <span className="rounded-full border border-beam/30 bg-volt/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-beam">
                    {category ?? 'Art'}
                  </span>
                </div>
                <div className="mt-2.5 flex h-36 items-center justify-center rounded-2xl px-4" style={{ background: gradient }}>
                  <p className="text-center text-[15px] font-medium text-white drop-shadow">{caption || 'your caption'}</p>
                </div>
                <p className="mt-2 text-[11px] text-sky">{hashtags.join(' ')}</p>
                {mood && <p className="mt-1 text-[11px] text-mist">mood: {mood} · {LANGUAGES.find((l) => l.code === language)?.label}</p>}
              </div>
              <p className="text-[12px] leading-relaxed text-mist">
                Publishing adds this Vibe to your profile and the feed on this device only — this is a demo, nothing leaves your browser.
              </p>
            </section>
          )}
        </div>

        <footer className="flex shrink-0 gap-2.5 border-t border-[#d8f3ff]/15 p-3">
          <button
            type="button"
            onClick={tryClose}
            className="rounded-full border border-[#d8f3ff]/25 bg-glass px-5 py-2.5 text-[13px] font-medium text-mist transition-colors hover:text-ink"
          >
            Cancel
          </button>
          <span className="flex-1" />
          {step < 3 ? (
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff] bg-volt/25 px-6 py-2.5 text-[13px] font-semibold text-white shadow-glow-in transition-colors hover:bg-volt/40 disabled:opacity-40"
            >
              Next <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              onClick={publish}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff] bg-gradient-to-r from-volt to-beam px-6 py-2.5 text-[13px] font-semibold text-white shadow-glow transition-transform hover:scale-[1.02]"
            >
              <Sparkles size={14} /> Publish
            </button>
          )}
        </footer>
      </div>

      <ConfirmModal
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={onClose}
        title="Discard this Vibe?"
        body="Your draft caption will be lost. This cannot be undone."
        confirmLabel="Discard"
        danger
      />
    </motion.div>
  );
}

function LivePreview({ gradient, caption, mood, hashtags }: { gradient: string; caption: string; mood: string | null; hashtags: string[] }) {
  return (
    <div className="rounded-2xl border border-[#d8f3ff]/25 bg-glass p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Live preview</p>
      <div className="flex h-32 items-center justify-center rounded-xl px-3" style={{ background: gradient }}>
        <p className="text-center text-[13px] font-medium leading-snug text-white drop-shadow">{caption || '…'}</p>
      </div>
      <p className="mt-1.5 text-[10px] text-mist">{mood ? `mood: ${mood}` : 'mood: —'} {hashtags.join(' ')}</p>
    </div>
  );
}
