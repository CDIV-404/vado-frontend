import { useEffect, useMemo, useState } from 'react';
import { Bell, BellRing, CalendarDays, Radio, Sparkles, Users } from 'lucide-react';
import { EVENTS, type VadoEvent } from '../data/mock';
import { load, save } from '../lib/store';
import { useToast } from '../components/Toast';
import { Chip, ConfirmModal, EmptyState, ScreenOverlay, SectionCard } from '../components/ui';

type Rsvp = 'none' | 'going' | 'remind';

const KIND_ICON: Record<VadoEvent['kind'], React.ReactNode> = {
  drop: <Sparkles size={15} />,
  live: <Radio size={15} />,
  workshop: <Users size={15} />,
};

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);
  return now;
}

function countdown(start: string, now: number): string {
  const ms = new Date(start).getTime() - now;
  if (ms <= 0) return 'live now';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export function EventsScreen({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const now = useNow();
  const [rsvps, setRsvps] = useState<Record<string, Rsvp>>(() => load<Record<string, Rsvp>>('eventRsvp', {}));
  const [filter, setFilter] = useState<'all' | VadoEvent['kind']>('all');
  const [confirm, setConfirm] = useState<{ id: string; next: Rsvp } | null>(null);

  const locale = useMemo(() => (typeof navigator !== 'undefined' ? navigator.language : 'en-US'), []);
  const fmtDate = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
    [locale],
  );
  const fmtZone = useMemo(() => new Intl.DateTimeFormat(locale, { timeZoneName: 'short' }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value ?? '', [locale]);

  const list = EVENTS.filter((e) => filter === 'all' || e.kind === filter);
  const goingCount = Object.values(rsvps).filter((v) => v !== 'none').length;

  const apply = (id: string, next: Rsvp) => {
    const merged = { ...rsvps, [id]: next };
    setRsvps(merged);
    save('eventRsvp', merged);
    const ev = EVENTS.find((e) => e.id === id);
    toast(next === 'going' ? `RSVP’d for ${ev?.title}` : next === 'remind' ? 'We’ll ping you 10 minutes before' : 'RSVP cleared');
  };

  return (
    <ScreenOverlay title="Events & Drops" onClose={onClose}>
      <p className="text-[12px] text-mist">
        Scheduled drops, lives and workshops. Times shown in your locale{fmtZone ? ` (${fmtZone})` : ''} — this device only.
      </p>
      <p className="mt-1 text-[11px] text-beam">{goingCount > 0 ? `${goingCount} event${goingCount === 1 ? '' : 's'} on your list` : 'Nothing on your list yet.'}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {(['all', 'drop', 'live', 'workshop'] as const).map((f) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)}>
            <span className="capitalize">{f}</span>
          </Chip>
        ))}
      </div>

      {list.length === 0 ? (
        <EmptyState icon={<CalendarDays size={26} />} title="No events here" body="Try another filter — new drops and lives land on this device." />
      ) : (
        <ul className="mt-4 space-y-3">
          {list.map((e) => {
            const state = rsvps[e.id] ?? 'none';
            const cd = countdown(e.start, now);
            const pct = Math.min(100, Math.round((e.going / e.capacity) * 100));
            return (
              <li key={e.id} className="overflow-hidden rounded-3xl border border-[#d8f3ff]/25 bg-glass backdrop-blur-lg">
                <div className="flex items-center gap-3 p-3.5">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white" style={{ background: e.gradient }} aria-hidden="true">
                    {KIND_ICON[e.kind]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-ink">{e.title}</p>
                    <p className="truncate text-[11px] text-mist">{e.host} · {e.handle}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    cd === 'live now' ? 'border-red-400/50 bg-red-500/15 text-red-200' : 'border-beam/40 bg-volt/15 text-beam'
                  }`} aria-label={`Starts ${cd}`}>
                    {cd === 'live now' ? 'LIVE' : cd}
                  </span>
                </div>
                <div className="px-3.5">
                  <p className="text-[12px] leading-relaxed text-ink">{e.desc}</p>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-mist">
                    <CalendarDays size={12} /> {fmtDate.format(new Date(e.start))} · {e.durationMin} min
                  </p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${e.going} of ${e.capacity} going`}>
                    <span className="block h-full rounded-full bg-gradient-to-r from-volt to-beam" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[10px] text-mist">{e.going.toLocaleString()} going · {e.capacity.toLocaleString()} capacity</p>
                </div>
                <div className="mt-3 flex gap-2 border-t border-[#d8f3ff]/10 p-3">
                  <button
                    type="button"
                    aria-pressed={state === 'going'}
                    onClick={() => setConfirm({ id: e.id, next: state === 'going' ? 'none' : 'going' })}
                    className={`flex-1 rounded-full border px-4 py-2 text-[12px] font-semibold transition-colors ${
                      state === 'going' ? 'border-[#4ade80]/50 bg-[#4ade80]/15 text-[#86efac]' : 'border-[#d8f3ff] bg-volt/25 text-white hover:bg-volt/40'
                    }`}
                  >
                    {state === 'going' ? 'Going ✓' : 'RSVP'}
                  </button>
                  <button
                    type="button"
                    aria-pressed={state === 'remind'}
                    onClick={() => setConfirm({ id: e.id, next: state === 'remind' ? 'none' : 'remind' })}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-[12px] transition-colors ${
                      state === 'remind' ? 'border-beam bg-volt/20 text-beam' : 'border-[#d8f3ff]/25 bg-glass text-mist hover:text-ink'
                    }`}
                  >
                    {state === 'remind' ? <BellRing size={13} /> : <Bell size={13} />} Remind
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <SectionCard title="How drops work" className="mt-5">
        <p className="text-[12px] leading-relaxed text-mist">
          A drop releases several Vibes at the same minute. RSVP to pin it to your list; Remind sends a demo notification ten minutes ahead. Everything is simulated on this device.
        </p>
      </SectionCard>

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && apply(confirm.id, confirm.next)}
        title={confirm?.next === 'going' ? 'Add this event to your list?' : confirm?.next === 'remind' ? 'Set a reminder?' : 'Remove your RSVP?'}
        body={
          confirm?.next === 'none'
            ? 'This clears your spot for the event on this device. You can RSVP again any time.'
            : 'This is a demo RSVP — nothing is sent and no account is charged.'
        }
        confirmLabel={confirm?.next === 'none' ? 'Remove RSVP' : 'Confirm'}
        danger={confirm?.next === 'none'}
      />
    </ScreenOverlay>
  );
}
