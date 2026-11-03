import { useMemo, useState } from 'react';
import { CalendarHeart, Download, Lock, Sparkles, Trash2 } from 'lucide-react';
import { MOODS, isoDate, seedMoodEntries, type MoodEntry } from '../data/mock';
import { load, save } from '../lib/store';
import { moodReflection } from '../lib/ai';
import { useToast } from '../components/Toast';
import { ConfirmModal, SectionCard, ScreenOverlay } from '../components/ui';

function moodColor(mood: string): string {
  return MOODS.find((m) => m.label.toLowerCase() === mood.toLowerCase())?.color ?? '#67baff';
}

function lastNDays(n: number): Date[] {
  const out: Date[] = [];
  const today = new Date();
  const start = new Date(today);
  start.setDate(today.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(d);
  }
  return out;
}

export function MoodTimelineScreen({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [entries, setEntries] = useState<MoodEntry[]>(() => {
    const stored = load<MoodEntry[] | null>('moodLog', null);
    if (stored) return stored;
    const seeded = seedMoodEntries();
    save('moodLog', seeded);
    return seeded;
  });
  const [selected, setSelected] = useState<string | null>(null);
  const [draftMood, setDraftMood] = useState<string | null>(null);
  const [draftNote, setDraftNote] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  const byDate = useMemo(() => new Map(entries.map((e) => [e.date, e])), [entries]);
  const days = useMemo(() => lastNDays(84), []);
  const todayIso = isoDate(new Date());

  const persist = (next: MoodEntry[]) => {
    setEntries(next);
    save('moodLog', next);
  };

  const openDay = (iso: string) => {
    const existing = byDate.get(iso);
    setSelected(iso);
    setDraftMood(existing?.mood ?? null);
    setDraftNote(existing?.note ?? '');
  };

  const saveCheckIn = () => {
    if (!selected || !draftMood) return;
    const next = entries.filter((e) => e.date !== selected);
    next.push({ date: selected, mood: draftMood, note: draftNote.trim() || undefined });
    persist(next.sort((a, b) => a.date.localeCompare(b.date)));
    setSelected(null);
    toast('Check-in saved — visible only to you');
  };

  const removeEntry = (date: string) => {
    persist(entries.filter((e) => e.date !== date));
    setConfirmDelete(null);
    if (selected === date) setSelected(null);
    toast('Check-in deleted');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ app: 'VADO mood timeline (demo)', privateByDefault: true, entries }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vado-mood-timeline.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Exported as JSON to your device');
  };

  const recent = [...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);

  return (
    <ScreenOverlay title="Mood Timeline" onClose={onClose}>
      <div className="flex items-start gap-3 rounded-2xl border border-beam/30 bg-volt/10 p-3.5">
        <Lock size={16} className="mt-0.5 shrink-0 text-beam" />
        <p className="text-[12px] leading-relaxed text-ink">
          <span className="font-semibold">Private by default.</span> Check-ins never appear in feeds, profiles or analytics.
          Reflections are creative prompts, not medical advice.
        </p>
      </div>

      <SectionCard title="Last 12 weeks" className="mt-4">
        <div className="grid grid-flow-col grid-rows-7 gap-1" role="img" aria-label="Mood heatmap, one square per day for the last 12 weeks">
          {days.map((d) => {
            const iso = isoDate(d);
            const e = byDate.get(iso);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => openDay(iso)}
                aria-label={e ? `${iso}: ${e.mood}. Change check-in.` : `${iso}: no check-in. Add one.`}
                title={e ? `${iso} — ${e.mood}` : `${iso} — nothing logged`}
                className={`h-4 w-4 rounded-[5px] transition-transform hover:scale-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-beam ${
                  iso === todayIso ? 'ring-1 ring-[#d8f3ff]' : ''
                }`}
                style={e ? { background: moodColor(e.mood) } : { background: 'rgba(216,243,255,0.08)' }}
              />
            );
          })}
        </div>
        <p className="mt-3 text-[11px] text-mist">Tap any square to check in or edit that day. Empty squares logged nothing.</p>
      </SectionCard>

      {selected && (
        <SectionCard title={`Check-in · ${selected}`} className="mt-4">
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Pick a mood">
            {MOODS.map((m) => (
              <button
                key={m.label}
                type="button"
                role="radio"
                aria-checked={draftMood === m.label}
                onClick={() => setDraftMood(m.label)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                  draftMood === m.label ? 'border-beam bg-volt/25 text-white' : 'border-[#d8f3ff]/25 bg-glass text-mist hover:text-ink'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} aria-hidden="true" />
                {m.label}
              </button>
            ))}
          </div>
          <input
            value={draftNote}
            onChange={(e) => setDraftNote(e.target.value.slice(0, 140))}
            placeholder="One line to yourself (optional)"
            aria-label="Check-in note"
            className="mt-3 w-full rounded-xl border border-[#d8f3ff]/30 bg-deep px-3.5 py-2.5 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveCheckIn}
              disabled={!draftMood}
              className="rounded-full border border-[#d8f3ff] bg-volt/25 px-4 py-2 text-[12px] font-semibold text-white shadow-glow-in transition-colors hover:bg-volt/40 disabled:opacity-40"
            >
              Save check-in
            </button>
            {byDate.has(selected) && (
              <button
                type="button"
                onClick={() => setConfirmDelete(selected)}
                className="rounded-full border border-red-400/50 bg-red-500/10 px-4 py-2 text-[12px] font-semibold text-red-200 transition-colors hover:bg-red-500/25"
              >
                Delete this day
              </button>
            )}
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="rounded-full border border-[#d8f3ff]/25 bg-glass px-4 py-2 text-[12px] text-mist transition-colors hover:text-ink"
            >
              Cancel
            </button>
          </div>
        </SectionCard>
      )}

      <SectionCard title="VADO AI reflection" className="mt-4">
        <p className="flex gap-2 text-[13px] leading-relaxed text-ink">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-beam" />
          {moodReflection(entries)}
        </p>
        <p className="mt-2 text-[11px] text-mist">Creative interpretation only — never a diagnosis. If you need real support, talk to a professional.</p>
      </SectionCard>

      <SectionCard title="Recent check-ins" className="mt-4">
        {recent.length === 0 ? (
          <p className="text-[12px] text-mist">Nothing logged yet. Tap a square above to start — it stays on this device.</p>
        ) : (
          <ul className="divide-y divide-[#d8f3ff]/10">
            {recent.map((e) => (
              <li key={e.date} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: moodColor(e.mood) }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] text-ink">
                    {e.mood} <span className="text-mist">· {e.date}</span>
                  </span>
                  {e.note && <span className="block truncate text-[11px] text-mist">{e.note}</span>}
                </span>
                <button
                  type="button"
                  aria-label={`Delete check-in ${e.date}`}
                  onClick={() => setConfirmDelete(e.date)}
                  className="rounded-full border border-[#d8f3ff]/25 p-1.5 text-mist transition-colors hover:text-red-300"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <div className="mt-4 flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={exportJson}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff]/35 bg-glass px-4 py-2 text-[12px] font-medium text-ink backdrop-blur-lg transition-colors hover:border-beam/60"
        >
          <Download size={13} /> Export JSON
        </button>
        <button
          type="button"
          onClick={() => setConfirmClear(true)}
          disabled={entries.length === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-red-400/50 bg-red-500/10 px-4 py-2 text-[12px] font-semibold text-red-200 transition-colors hover:bg-red-500/25 disabled:opacity-40"
        >
          <CalendarHeart size={13} /> Clear all check-ins
        </button>
      </div>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => confirmDelete && removeEntry(confirmDelete)}
        title="Delete this check-in?"
        body="The mood entry for this day will be removed from this device. This cannot be undone."
        confirmLabel="Delete check-in"
        danger
      />
      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={() => {
          persist([]);
          setConfirmClear(false);
          setSelected(null);
          toast('Mood timeline cleared');
        }}
        title="Clear the whole timeline?"
        body={`All ${entries.length} check-ins stored on this device will be erased. Export first if you want to keep a copy. This cannot be undone.`}
        confirmLabel="Clear timeline"
        danger
      />
    </ScreenOverlay>
  );
}
