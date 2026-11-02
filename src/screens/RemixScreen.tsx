import { useMemo, useState } from 'react';
import { ArrowLeftRight, GitBranch, Sparkles } from 'lucide-react';
import { GRADIENTS, MOODS, REMIX_ACTIONS, type Vibe } from '../data/mock';
import { load, save } from '../lib/store';
import { useToast } from '../components/Toast';
import { Chip, ConfirmModal, SectionCard, ScreenOverlay } from '../components/ui';

function buildChain(start: Vibe, all: Vibe[]): Vibe[] {
  const byId = new Map(all.map((v) => [v.id, v]));
  const chain: Vibe[] = [start];
  let cur = start;
  while (cur.remixOf) {
    const next = byId.get(cur.remixOf);
    if (!next || chain.includes(next)) break;
    chain.unshift(next);
    cur = next;
  }
  return chain;
}

export function RemixScreen({
  vibe,
  published,
  session,
  onPublish,
  onClose,
}: {
  vibe: Vibe;
  published: Vibe[];
  session: string | null;
  onPublish: (v: Vibe) => void;
  onClose: () => void;
}) {
  const toast = useToast();
  const all = useMemo(() => [...published, ...[vibe]], [published, vibe]);
  const chain = useMemo(() => buildChain(vibe, all), [vibe, all]);
  const [caption, setCaption] = useState(`after ${vibe.handle}: ${vibe.caption.toLowerCase()}`);
  const [mood, setMood] = useState<string>(vibe.mood);
  const [grade, setGrade] = useState(0);
  const [applied, setApplied] = useState<string[]>([]);
  const [allowRemix, setAllowRemix] = useState(true);
  const [confirmClose, setConfirmClose] = useState(false);

  const gradient = useMemo(() => {
    const mc = MOODS.find((m) => m.label === mood)?.color;
    if (grade > 0) return GRADIENTS[grade % GRADIENTS.length];
    if (mc) return `linear-gradient(135deg,#07192b,${mc})`;
    return vibe.gradient;
  }, [mood, grade, vibe.gradient]);

  const applyAction = (id: string) => {
    if (applied.includes(id)) return;
    setApplied((a) => [...a, id]);
    if (id === 'flip') {
      const others = MOODS.filter((m) => m.label !== mood);
      setMood(others[(others.length - 1 + caption.length) % others.length].label);
    } else if (id === 'rewrite') {
      setCaption((c) => `rewound: ${c.replace(/^rewound: /, '')}`);
    } else if (id === 'continue') {
      setCaption((c) => `${c} — and then it kept going`);
    } else if (id === 'grade') {
      setGrade((g) => g + 1);
    } else if (id === 'translate') {
      setCaption((c) => `${c} · bonne vibe`);
    }
    toast('AI remix action applied');
  };

  const publish = () => {
    const name = session ?? 'You';
    const v: Vibe = {
      id: `my-${Date.now()}`,
      creator: name,
      handle: `@${name.toLowerCase().replace(/\s+/g, '.')}`,
      caption: caption.trim(),
      gradient,
      category: vibe.category,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      time: 'now',
      mood,
      hashtags: vibe.hashtags.slice(0, 1),
      format: 'visual',
      mine: true,
      visibility: 'public',
      remixOf: vibe.id,
      remixedFrom: vibe.handle,
      allowRemix,
    };
    save('myVibes', [v, ...load<Vibe[]>('myVibes', [])]);
    onPublish(v);
    toast(`Remix published — credited to ${vibe.handle}`);
    onClose();
  };

  return (
    <ScreenOverlay title="Remix a Vibe" onClose={() => setConfirmClose(true)}>
      <SectionCard title="Remix chain">
        <ol className="flex flex-wrap items-center gap-2" aria-label={`Remix chain: ${chain.map((c) => c.handle).join(', then ')}`}>
          {chain.map((c, i) => (
            <li key={c.id} className="flex items-center gap-2">
              {i > 0 && <GitBranch size={13} className="text-mist" aria-hidden="true" />}
              <span
                className={`rounded-full border px-3 py-1 text-[12px] ${
                  c.id === vibe.id ? 'border-beam bg-volt/20 text-ink' : 'border-[#d8f3ff]/25 bg-glass text-mist'
                }`}
              >
                {c.handle}
                {c.id === vibe.id && ' · you remix this'}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2.5 text-[11px] leading-relaxed text-mist">
          Attribution is permanent: your remix will always show “Remixed from {vibe.handle}”, and the original stays linked.
        </p>
      </SectionCard>

      <div className="mt-4 overflow-hidden rounded-3xl border border-[#d8f3ff]/25 bg-glass p-3.5 backdrop-blur-lg">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Original</p>
        <p className="mt-1.5 text-[13px] text-ink">{vibe.caption}</p>
        <p className="mt-1 text-[11px] text-mist">{vibe.creator} · {vibe.handle} · mood: {vibe.mood}</p>
      </div>

      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
          <Sparkles size={12} /> AI remix actions
        </p>
        <div className="flex flex-wrap gap-2">
          {REMIX_ACTIONS.map((a) => (
            <Chip key={a.id} active={applied.includes(a.id)} onClick={() => applyAction(a.id)}>
              {a.label}
            </Chip>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-mist">
          {applied.length ? `${applied.length} applied — tweak below, then publish.` : 'One tap transforms the draft. Tap any combination.'}
        </p>
      </div>

      <label className="mb-1.5 mt-4 block text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Your caption</label>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value.slice(0, 200))}
        rows={3}
        maxLength={200}
        aria-label="Remix caption"
        className="w-full resize-none rounded-2xl border border-[#d8f3ff]/30 bg-volt/10 px-4 py-3 text-[14px] text-ink outline-none focus:border-beam/70"
      />
      <p className="text-right text-[11px] text-mist">{caption.length}/200</p>

      <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Remix mood">
        {MOODS.map((m) => (
          <button
            key={m.label}
            type="button"
            role="radio"
            aria-checked={mood === m.label}
            onClick={() => setMood(m.label)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
              mood === m.label ? 'border-beam bg-volt/25 text-white' : 'border-[#d8f3ff]/25 bg-glass text-mist hover:text-ink'
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} aria-hidden="true" />
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#d8f3ff]/25 bg-glass p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Preview</p>
          <div className="flex h-28 items-center justify-center rounded-xl px-3" style={{ background: gradient }}>
            <p className="text-center text-[13px] font-medium leading-snug text-white drop-shadow">{caption || '…'}</p>
          </div>
          <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-beam">
            <ArrowLeftRight size={11} /> Remixed from {vibe.handle}
          </p>
        </div>
        <div className="rounded-2xl border border-[#d8f3ff]/25 bg-glass p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Remix settings</p>
          <label className="flex items-center gap-2 text-[12px] text-ink">
            <input
              type="checkbox"
              checked={allowRemix}
              onChange={(e) => setAllowRemix(e.target.checked)}
              className="h-4 w-4 accent-[#1687ff]"
            />
            Allow others to remix this version
          </label>
          <p className="mt-2 text-[11px] leading-relaxed text-mist">
            Turning this off stops further remixes downstream — your credit to {vibe.handle} stays either way.
          </p>
        </div>
      </div>

      <div className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={() => setConfirmClose(true)}
          className="rounded-full border border-[#d8f3ff]/25 bg-glass px-5 py-2.5 text-[13px] font-medium text-mist transition-colors hover:text-ink"
        >
          Cancel
        </button>
        <span className="flex-1" />
        <button
          type="button"
          onClick={publish}
          disabled={!caption.trim()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff] bg-gradient-to-r from-volt to-beam px-6 py-2.5 text-[13px] font-semibold text-white shadow-glow transition-transform hover:scale-[1.02] disabled:opacity-40"
        >
          <Sparkles size={14} /> Publish remix
        </button>
      </div>

      <ConfirmModal
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={onClose}
        title="Discard this remix?"
        body="Your remix draft will be lost. The original Vibe is untouched."
        confirmLabel="Discard remix"
        danger
      />
    </ScreenOverlay>
  );
}
