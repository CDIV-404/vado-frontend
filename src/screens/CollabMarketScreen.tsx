import { useMemo, useState } from 'react';
import { Ban, Briefcase, Filter, Send, ShieldAlert, Sparkles } from 'lucide-react';
import {
  CREATOR_POOL, seedMarketListings, seedMarketRequests,
  type MarketListing, type MarketRequest, type MarketRole,
} from '../data/mock';
import { load, save } from '../lib/store';
import { useToast } from '../components/Toast';
import { Chip, ConfirmModal, EmptyState, ScreenOverlay, SectionCard } from '../components/ui';

const ROLES: MarketRole[] = ['Videographer', 'Editor', 'Sound design', 'Motion', 'Photographer', 'Copywriting'];

export function CollabMarketScreen({ session, onClose }: { session: string | null; onClose: () => void }) {
  const toast = useToast();
  const [listings, setListings] = useState<MarketListing[]>(() => {
    const stored = load<MarketListing[] | null>('marketListings', null);
    if (stored) return stored;
    const seeded = seedMarketListings();
    save('marketListings', seeded);
    return seeded;
  });
  const [requests, setRequests] = useState<MarketRequest[]>(() => {
    const stored = load<MarketRequest[] | null>('marketRequests', null);
    if (stored) return stored;
    const seeded = seedMarketRequests();
    save('marketRequests', seeded);
    return seeded;
  });
  const [blocked, setBlocked] = useState<string[]>(() => load<string[]>('marketBlocked', []));
  const [roleFilter, setRoleFilter] = useState<MarketRole | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [applyTo, setApplyTo] = useState<MarketListing | null>(null);
  const [applyRole, setApplyRole] = useState<MarketRole | null>(null);
  const [applyNote, setApplyNote] = useState('');
  const [confirm, setConfirm] = useState<{ kind: 'block' | 'close' | 'withdraw'; id: string } | null>(null);

  const me = `@${(session ?? 'you').toLowerCase().replace(/\s+/g, '.')}`;

  const persistListings = (next: MarketListing[]) => {
    setListings(next);
    save('marketListings', next);
  };
  const persistRequests = (next: MarketRequest[]) => {
    setRequests(next);
    save('marketRequests', next);
  };

  const visible = listings
    .filter((l) => !blocked.includes(l.handle))
    .filter((l) => (roleFilter ? l.needs.includes(roleFilter) : true))
    .filter((l) => (openOnly ? l.status === 'open' : true));

  const matches = useMemo(() => {
    if (!applyTo) return [];
    return CREATOR_POOL
      .map((c) => {
        const overlap = c.skills.filter((s) => applyTo.needs.includes(s)).length;
        return { c, score: overlap * 30 + c.match / 4 };
      })
      .filter((x) => x.c.skills.some((s) => applyTo.needs.includes(s)))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }, [applyTo]);

  const sendRequest = () => {
    if (!applyTo || !applyRole) return;
    const req: MarketRequest = {
      id: `mr-${Date.now()}`,
      listingId: applyTo.id,
      title: applyTo.title,
      from: me,
      role: applyRole,
      note: applyNote.trim().slice(0, 160) || 'Happy to send a test piece.',
      status: 'sent',
      at: 'now',
    };
    persistRequests([req, ...requests]);
    setApplyTo(null);
    setApplyRole(null);
    setApplyNote('');
    toast('Request sent — no payment details involved, demo coins only');
  };

  const mySent = requests.filter((r) => r.from === me);
  const incoming = requests.filter((r) => r.from !== me);

  return (
    <ScreenOverlay title="Collaboration Marketplace" onClose={onClose}>
      <p className="text-[12px] text-mist">
        Post a brief, find matchable creators, and agree roles before anyone starts. Names are masked until both sides accept — budgets stay in demo coins.
      </p>

      <div className="mt-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
        <Filter size={12} /> Filter
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <Chip key={r} active={roleFilter === r} onClick={() => setRoleFilter(roleFilter === r ? null : r)}>{r}</Chip>
        ))}
        <Chip active={openOnly} onClick={() => setOpenOnly(!openOnly)}>Open only</Chip>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const title = new FormData(e.currentTarget).get('title');
          const brief = new FormData(e.currentTarget).get('brief');
          const deadline = new FormData(e.currentTarget).get('deadline');
          if (typeof title !== 'string' || !title.trim()) return;
          const l: MarketListing = {
            id: `m-${Date.now()}`,
            title: title.trim().slice(0, 60),
            poster: session ?? 'You',
            handle: me,
            needs: ROLES.filter((r) => roleFilter && r === roleFilter),
            brief: typeof brief === 'string' ? brief.trim().slice(0, 200) : '',
            deadline: typeof deadline === 'string' && deadline.trim() ? deadline.trim().slice(0, 20) : 'Flexible',
            budget: 'demo coins only',
            status: 'open',
          };
          persistListings([l, ...listings]);
          e.currentTarget.reset();
          toast('Brief posted — masked until someone is accepted');
        }}
        className="mt-5 space-y-2 rounded-3xl border border-[#d8f3ff]/25 bg-glass p-4"
      >
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
          <Briefcase size={12} /> Post a brief
        </p>
        <input
          name="title"
          aria-label="Brief title"
          placeholder="What are you making?"
          className="w-full rounded-xl border border-[#d8f3ff]/30 bg-deep px-3.5 py-2.5 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
        />
        <textarea
          name="brief"
          aria-label="Brief description"
          rows={2}
          maxLength={200}
          placeholder="Scope, vibe, deliverables…"
          className="w-full resize-none rounded-xl border border-[#d8f3ff]/30 bg-deep px-3.5 py-2.5 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
        />
        <div className="flex gap-2">
          <input
            name="deadline"
            aria-label="Deadline"
            placeholder="Deadline (e.g. Nov 20)"
            className="min-w-0 flex-1 rounded-xl border border-[#d8f3ff]/30 bg-deep px-3.5 py-2.5 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
          />
          <button
            type="submit"
            className="rounded-full border border-[#d8f3ff] bg-volt/25 px-5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-volt/40"
          >
            Post brief
          </button>
        </div>
        <p className="text-[11px] text-mist">
          Tip: pick a role filter above and the brief is tagged with it.{' '}
          {roleFilter ? `Tagged: ${roleFilter}` : 'No role tagged yet.'}
        </p>
      </form>

      {visible.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={<Ban size={26} />}
            title={blocked.length > 0 ? 'Nothing left with these filters' : 'No briefs right now'}
            body={blocked.length > 0 ? 'You blocked some posters. Loosen the filters to see the rest.' : 'Post a brief above, or check back after the next drop.'}
          />
        </div>
      ) : (
        <ul className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {visible.map((l) => (
            <li key={l.id} className={`rounded-3xl border bg-glass p-4 backdrop-blur-lg ${l.status === 'open' ? 'border-[#d8f3ff]/25' : 'border-[#d8f3ff]/15 opacity-70'}`}>
              <div className="flex items-start gap-2">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">{l.title}</span>
                  <span className="block truncate text-[11px] text-mist">{l.poster} · {l.handle}</span>
                </span>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                  l.status === 'open' ? 'border-beam/40 bg-volt/15 text-beam' : 'border-[#d8f3ff]/25 bg-white/5 text-mist'
                }`}>
                  {l.status}
                </span>
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-ink">{l.brief || 'No brief supplied.'}</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {l.needs.map((n) => (
                  <span key={n} className="rounded-full border border-[#d8f3ff]/20 bg-white/5 px-2.5 py-0.5 text-[10px] text-mist">{n}</span>
                ))}
                {l.needs.length === 0 && <span className="text-[11px] text-mist">Open roles — say what you do.</span>}
              </div>
              <p className="mt-2 text-[11px] text-mist">Deadline {l.deadline} · {l.budget}</p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  disabled={l.status !== 'open'}
                  onClick={() => {
                    setApplyTo(l);
                    setApplyRole(l.needs[0] ?? null);
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#d8f3ff] bg-volt/25 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-volt/40 disabled:opacity-40"
                >
                  <Send size={13} /> Request to join
                </button>
                <button
                  type="button"
                  onClick={() => setConfirm({ kind: 'block', id: l.handle })}
                  className="rounded-full border border-[#d8f3ff]/25 bg-glass px-3.5 py-2 text-[11px] text-mist transition-colors hover:text-ink"
                >
                  Report / block
                </button>
                {l.handle === me && l.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => setConfirm({ kind: 'close', id: l.id })}
                    className="rounded-full border border-[#d8f3ff]/25 bg-glass px-3.5 py-2 text-[11px] text-mist transition-colors hover:text-ink"
                  >
                    Close
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <SectionCard title="Your requests" className="mt-6">
        {mySent.length === 0 ? (
          <p className="text-[12px] text-mist">You have not asked to join anything yet.</p>
        ) : (
          <ul className="space-y-2.5" aria-label="Requests you sent">
            {mySent.map((r) => (
              <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3.5 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] text-ink">{r.title}</span>
                  <span className="block text-[11px] text-mist">{r.role} · sent {r.at}</span>
                </span>
                <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                  r.status === 'accepted' ? 'border-[#4ade80]/40 bg-[#4ade80]/10 text-[#86efac]'
                    : r.status === 'interviewing' ? 'border-beam/40 bg-volt/15 text-beam'
                      : r.status === 'declined' ? 'border-red-400/40 bg-red-500/10 text-red-200'
                        : 'border-[#d8f3ff]/25 bg-white/5 text-mist'
                }`}>
                  {r.status}
                </span>
                {r.status === 'sent' && (
                  <button
                    type="button"
                    onClick={() => setConfirm({ kind: 'withdraw', id: r.id })}
                    className="shrink-0 rounded-full border border-[#d8f3ff]/25 bg-glass px-3 py-1 text-[11px] text-mist transition-colors hover:text-ink"
                  >
                    Withdraw
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Incoming requests" className="mt-4">
        {incoming.length === 0 ? (
          <p className="text-[12px] text-mist">No one has asked to join your briefs yet.</p>
        ) : (
          <ul className="space-y-2.5" aria-label="Requests others sent you">
            {incoming.map((r) => (
              <li key={r.id} className="rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-[12px] text-ink">{r.from} · {r.role}</span>
                  <span className="text-[11px] text-mist">{r.at}</span>
                </div>
                <p className="mt-1 text-[11px] text-mist">on “{r.title}” — “{r.note}”</p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      persistRequests(requests.map((x) => (x.id === r.id ? { ...x, status: 'accepted' } : x)));
                      toast(`${r.from} accepted for ${r.role} — handles now visible to both sides`);
                    }}
                    className="rounded-full border border-[#d8f3ff] bg-volt/25 px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-volt/40"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      persistRequests(requests.map((x) => (x.id === r.id ? { ...x, status: 'declined' } : x)));
                      toast('Request declined');
                    }}
                    className="rounded-full border border-[#d8f3ff]/25 bg-glass px-4 py-1.5 text-[11px] text-mist transition-colors hover:text-ink"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      {blocked.length > 0 && (
        <SectionCard title="Blocked posters" className="mt-4">
          <ul className="space-y-2">
            {blocked.map((h) => (
              <li key={h} className="flex items-center gap-3 text-[12px] text-mist">
                <ShieldAlert size={13} className="text-beam" />
                <span className="min-w-0 flex-1 truncate">{h}</span>
                <button
                  type="button"
                  onClick={() => {
                    const next = blocked.filter((x) => x !== h);
                    setBlocked(next);
                    save('marketBlocked', next);
                    toast('Unblocked — their briefs are visible again');
                  }}
                  className="rounded-full border border-[#d8f3ff]/25 bg-glass px-3 py-1 text-[11px] transition-colors hover:text-ink"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      {applyTo && (
        <div className="mt-6 rounded-3xl border border-beam/40 bg-volt/10 p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
            <Sparkles size={12} /> AI match for “{applyTo.title}”
          </p>
          <ul className="mt-3 space-y-2">
            {matches.map(({ c, score }) => (
              <li key={c.handle} className="flex items-center gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-deep/60 px-3.5 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[12px] text-ink">{c.name} <span className="text-mist">{c.handle}</span></span>
                  <span className="block truncate text-[11px] text-mist">{c.skills.join(' · ')} — {c.note}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-[13px] font-semibold text-beam">{Math.min(99, Math.round(score))}%</span>
                  <span className="block text-[10px] uppercase tracking-wide text-mist">match</span>
                </span>
              </li>
            ))}
            {matches.length === 0 && <li className="text-[12px] text-mist">No creator in the demo pool covers these roles.</li>}
          </ul>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendRequest();
            }}
            className="mt-4 space-y-2"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Send your request</p>
            <div className="flex flex-wrap gap-2">
              {(applyTo.needs.length > 0 ? applyTo.needs : ROLES).map((r) => (
                <Chip key={r} active={applyRole === r} onClick={() => setApplyRole(r)}>{r}</Chip>
              ))}
            </div>
            <textarea
              value={applyNote}
              onChange={(e) => setApplyNote(e.target.value.slice(0, 160))}
              rows={2}
              maxLength={160}
              aria-label="Note to the poster"
              placeholder="What do you bring, and when are you free?"
              className="w-full resize-none rounded-xl border border-[#d8f3ff]/30 bg-deep px-3.5 py-2.5 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!applyRole}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff] bg-volt/25 px-5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-volt/40 disabled:opacity-40"
              >
                <Send size={13} /> Send request
              </button>
              <button
                type="button"
                onClick={() => { setApplyTo(null); setApplyNote(''); }}
                className="rounded-full border border-[#d8f3ff]/25 bg-glass px-4 py-2 text-[12px] text-mist transition-colors hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal
        open={confirm?.kind === 'block'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          const id = confirm!.id;
          const next = blocked.includes(id) ? blocked : [...blocked, id];
          setBlocked(next);
          save('marketBlocked', next);
          setConfirm(null);
          toast('Reported and blocked — their briefs are hidden and they cannot see yours');
        }}
        title="Report and block this poster?"
        body="Their briefs disappear from your marketplace and no new requests can pass between you. You can undo this in Blocked posters."
        confirmLabel="Report & block"
        danger
      />
      <ConfirmModal
        open={confirm?.kind === 'close'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          persistListings(listings.map((l) => (l.id === confirm!.id ? { ...l, status: 'closed' } : l)));
          setConfirm(null);
          toast('Brief closed — incoming requests are frozen');
        }}
        title="Close this brief?"
        body="People can no longer request to join it. Existing requests keep their status."
        confirmLabel="Close brief"
      />
      <ConfirmModal
        open={confirm?.kind === 'withdraw'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          persistRequests(requests.filter((r) => r.id !== confirm!.id));
          setConfirm(null);
          toast('Request withdrawn');
        }}
        title="Withdraw this request?"
        body="It is removed for both sides. You can send a new one later while the brief stays open."
        confirmLabel="Withdraw"
      />
    </ScreenOverlay>
  );
}
