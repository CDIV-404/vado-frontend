import { useMemo, useState } from 'react';
import { CheckCircle2, History, Layers, Lock, Send, Sparkles, UserPlus } from 'lucide-react';
import {
  COLLAB_ROLE_CAPS, MOODS, seedCollabVibes, type CollabRevision, type CollabVibe,
} from '../data/mock';
import { load, save } from '../lib/store';
import { useToast } from '../components/Toast';
import { Chip, ConfirmModal, EmptyState, ScreenOverlay, SectionCard } from '../components/ui';

type MyHandle = string;

export function CollabVibeScreen({
  session,
  onClose,
  onPublish,
}: {
  session: string | null;
  onClose: () => void;
  onPublish: (vibe: CollabVibe) => void;
}) {
  const toast = useToast();
  const [boards, setBoards] = useState<CollabVibe[]>(() => {
    const stored = load<CollabVibe[] | null>('collabVibes', null);
    if (stored) return stored;
    const seeded = seedCollabVibes();
    save('collabVibes', seeded);
    return seeded;
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState('');
  const [captionDraft, setCaptionDraft] = useState('');
  const [moodDraft, setMoodDraft] = useState<string | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);

  const meRaw: MyHandle = `@${(session ?? 'you').toLowerCase().replace(/\s+/g, '.')}`;
  const norm = (h: string) => (h === '@you' || h === meRaw ? meRaw : h);
  const me = meRaw;
  const open = boards.find((b) => b.id === openId) ?? null;
  const myRole = open?.roles.find((r) => norm(r.handle) === me)?.role ?? 'Viewer';
  const canEdit = open ? myRole === 'Owner' || myRole === 'Editor' : false;
  const canPublish = myRole === 'Owner' || myRole === 'Editor';

  const persist = (next: CollabVibe[]) => {
    setBoards(next);
    save('collabVibes', next);
  };

  const patchOpen = (patch: Partial<CollabVibe>, note?: string) => {
    if (!open) return;
    const revision: CollabRevision[] = note
      ? [...open.revisions, { id: `r-${Date.now()}`, author: me, at: 'now', note }]
      : open.revisions;
    persist(boards.map((b) => (b.id === open.id ? { ...b, ...patch, revisions: revision } : b)));
  };

  const createBoard = () => {
    const title = titleDraft.trim();
    if (!title) return;
    const b: CollabVibe = {
      id: `cv-${Date.now()}`,
      title: title.slice(0, 40),
      caption: '',
      gradient: 'linear-gradient(135deg,#07192b,#1687ff)',
      mood: 'Calm',
      visibility: 'private',
      approval: 'required',
      status: 'draft',
      roles: [{ handle: me, role: 'Owner' }],
      presence: [],
      revisions: [{ id: `r-${Date.now()}`, author: me, at: 'now', note: 'opened the board (private by default)' }],
    };
    persist([b, ...boards]);
    setTitleDraft('');
    setOpenId(b.id);
    toast('Collaboration board created — private until you publish');
  };

  const invite = () => {
    if (!open || !canEdit) return;
    const existing = open.roles.map((r) => r.handle);
    const pool = ['@nova.wav', '@mira.sol', '@lofi.luna', '@crumb.co', '@orbit.oz'].filter((h) => !existing.includes(h));
    if (pool.length === 0) {
      toast('Every demo creator is already on this board');
      return;
    }
    const role = myRole === 'Owner' ? 'Editor' : 'Contributor';
    patchOpen({ roles: [...open.roles, { handle: pool[0], role }] }, `invited ${pool[0]} as ${role}`);
    toast(`${pool[0]} invited as ${role}`);
  };

  const submitForApproval = () => {
    if (!open) return;
    if (open.approval === 'auto') {
      patchOpen({ status: 'approved' }, 'auto-approved for publish');
      toast('Auto-approval on — board is ready to publish');
      return;
    }
    patchOpen({ status: 'pending' }, 'submitted for owner approval');
    toast('Submitted — the Owner has to approve before publish');
  };

  const publish = () => {
    if (!open) return;
    onPublish(open);
    patchOpen({ status: 'published' }, 'published to the feed');
    setConfirmPublish(false);
    toast('Published — collaborators notified');
  };

  const presenceLine = useMemo(() => {
    if (!open) return '';
    if (open.presence.length === 0) return 'No one else is in this board right now.';
    return `${open.presence.join(', ')} editing now`;
  }, [open]);

  if (open) {
    const locked = !canEdit;
    return (
      <ScreenOverlay title={open.title} onClose={() => { setOpenId(null); setCaptionDraft(''); setMoodDraft(null); }}>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full border border-beam/30 bg-volt/15 px-3 py-1 font-medium text-beam">You: {myRole}</span>
          <span className={`rounded-full border px-3 py-1 uppercase tracking-wide ${
            open.status === 'published' ? 'border-[#4ade80]/40 bg-[#4ade80]/10 text-[#86efac]'
              : open.status === 'approved' ? 'border-beam/40 bg-volt/15 text-beam'
                : open.status === 'pending' ? 'border-amber-300/40 bg-amber-400/10 text-amber-200'
                  : 'border-[#d8f3ff]/25 bg-white/5 text-mist'
          }`}>
            {open.status}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-[#d8f3ff]/25 bg-white/5 px-3 py-1 text-mist">
            <Lock size={10} /> {open.visibility}
          </span>
          <span className="flex-1" />
          <span className="text-mist">{presenceLine}</span>
        </div>

        <div className="mt-4 flex h-40 items-center justify-center rounded-3xl border border-[#d8f3ff]/25 px-5" style={{ background: open.gradient }}>
          <p className="text-center text-[15px] font-medium text-white drop-shadow">{open.caption || 'no caption yet'}</p>
        </div>

        <SectionCard title="Roles on this board" className="mt-4">
          <ul className="mb-3 space-y-1.5">
            {open.roles.map((r) => (
              <li key={r.handle} className="flex items-center gap-2 text-[12px]">
                <span className={`h-2 w-2 shrink-0 rounded-full ${open.presence.includes(norm(r.handle)) ? 'bg-beam shadow-glow' : 'bg-[#d8f3ff]/30'}`} aria-hidden="true" />
                <span className={`min-w-0 flex-1 truncate ${norm(r.handle) === me ? 'text-ink' : 'text-mist'}`}>
                  {norm(r.handle) === me ? `${me} (you)` : r.handle}
                </span>
                <span className="rounded-full border border-[#d8f3ff]/20 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-mist">{r.role}</span>
                {myRole === 'Owner' && norm(r.handle) !== me && (
                  <button
                    type="button"
                    onClick={() => {
                      const order = ['Owner', 'Editor', 'Contributor', 'Viewer'] as const;
                      const at = order.indexOf(r.role);
                      const nextRole = order[(at + 1) % order.length];
                      persist(boards.map((b) => (b.id === open.id
                        ? { ...b, roles: b.roles.map((x) => (norm(x.handle) === norm(r.handle) ? { ...x, role: nextRole } : x)), revisions: [...b.revisions, { id: `r-${Date.now()}`, author: me, at: 'now', note: `changed ${r.handle} to ${nextRole}` }] }
                        : b)));
                      toast(`${r.handle} is now ${nextRole}`);
                    }}
                    className="rounded-full border border-[#d8f3ff]/25 bg-glass px-2.5 py-0.5 text-[10px] text-mist transition-colors hover:text-ink"
                  >
                    change
                  </button>
                )}
              </li>
            ))}
          </ul>
          <ul className="space-y-1 text-[11px] text-mist">
            {COLLAB_ROLE_CAPS.map((c) => (
              <li key={c.role}><strong className="text-ink">{c.role}</strong> — {c.can}</li>
            ))}
          </ul>
          {myRole === 'Owner' && (
            <button
              type="button"
              onClick={() => {
                persist(boards.map((b) => (b.id === open.id
                  ? { ...b, approval: b.approval === 'required' ? 'auto' : 'required', revisions: [...b.revisions, { id: `r-${Date.now()}`, author: me, at: 'now', note: b.approval === 'required' ? 'turned approval off (auto-publish)' : 'turned approval on (owner sign-off)' }] }
                  : b)));
                toast(open.approval === 'required' ? 'Auto-approval on — Editors can publish directly' : 'Approval required before anyone publishes');
              }}
              className="mt-3 w-full rounded-full border border-[#d8f3ff]/25 bg-glass px-4 py-2 text-[12px] text-ink transition-colors hover:border-beam/70"
            >
              Approval before publish: <strong>{open.approval === 'required' ? 'required' : 'auto'}</strong> — tap to toggle
            </button>
          )}
        </SectionCard>

        {!locked && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = captionDraft.trim();
              if (!text) return;
              patchOpen({ caption: text.slice(0, 200) }, 'caption updated');
              setCaptionDraft('');
              toast('Caption saved to the board');
            }}
            className="mt-5 space-y-2"
          >
            <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-beam" htmlFor="collab-caption">
              Suggest a caption
            </label>
            <textarea
              id="collab-caption"
              value={captionDraft}
              onChange={(e) => setCaptionDraft(e.target.value.slice(0, 200))}
              rows={2}
              placeholder={myRole === 'Contributor' ? 'Contributors suggest — the Owner approves what lands…' : 'Write the line…'}
              className="w-full resize-none rounded-2xl border border-[#d8f3ff]/30 bg-volt/10 px-4 py-3 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded-full border border-[#d8f3ff] bg-volt/25 px-5 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-volt/40"
              >
                Save to board
              </button>
              <span className="flex-1" />
              <button
                type="button"
                onClick={invite}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff]/25 bg-glass px-4 py-2 text-[12px] text-mist transition-colors hover:text-ink"
              >
                <UserPlus size={13} /> Invite
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {MOODS.slice(0, 6).map((m) => (
                <Chip key={m.label} active={moodDraft === m.label} onClick={() => setMoodDraft(moodDraft === m.label ? null : m.label)}>
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: m.color }} aria-hidden="true" />
                  {m.label}
                </Chip>
              ))}
            </div>
            {moodDraft && (
              <button
                type="button"
                onClick={() => {
                  const mc = MOODS.find((m) => m.label === moodDraft)?.color ?? '#1687ff';
                  patchOpen({ mood: moodDraft, gradient: `linear-gradient(135deg,#07192b,${mc})` }, `mood set to ${moodDraft}`);
                  toast(`Board mood: ${moodDraft}`);
                }}
                className="rounded-full border border-beam/50 bg-volt/20 px-4 py-1.5 text-[11px] font-medium text-beam transition-colors hover:bg-volt/30"
              >
                Apply “{moodDraft}” to the board
              </button>
            )}
          </form>
        )}

        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
            <History size={12} /> Revision history
          </p>
          <ol className="space-y-2">
            {[...open.revisions].reverse().map((r, i) => (
              <li key={r.id} className="flex items-start gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3.5 py-2.5">
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${i === 0 ? 'bg-beam shadow-glow' : 'bg-[#d8f3ff]/30'}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] text-ink">{r.note}</span>
                  <span className="block text-[11px] text-mist">{r.author} · {r.at}</span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="mt-5 flex gap-2.5">
          {open.status !== 'published' && (
            <>
              {(myRole === 'Owner' || myRole === 'Editor' || myRole === 'Contributor') && open.status !== 'pending' && open.status !== 'approved' && (
                <button
                  type="button"
                  onClick={submitForApproval}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#d8f3ff]/30 bg-glass px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-beam/70"
                >
                  <Send size={14} /> Submit for approval
                </button>
              )}
              {open.status === 'pending' && myRole === 'Owner' && (
                <button
                  type="button"
                  onClick={() => {
                    patchOpen({ status: 'approved' }, 'approved the pending change');
                    toast('Approved — ready to publish');
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-beam/50 bg-volt/20 px-4 py-2.5 text-[13px] font-semibold text-beam transition-colors hover:bg-volt/30"
                >
                  <CheckCircle2 size={14} /> Approve
                </button>
              )}
              {canPublish && (
                <button
                  type="button"
                  onClick={() => setConfirmPublish(true)}
                  disabled={open.approval === 'required' && open.status !== 'approved'}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-[#d8f3ff] bg-gradient-to-r from-volt to-beam px-4 py-2.5 text-[13px] font-semibold text-white shadow-glow transition-transform hover:scale-[1.01] disabled:opacity-40"
                >
                  <Sparkles size={14} /> Publish
                </button>
              )}
            </>
          )}
          {open.status === 'published' && (
            <p className="text-[12px] text-mist">Published to the feed — the board and its history stay editable for the next version.</p>
          )}
          {open.status === 'pending' && myRole !== 'Owner' && (
            <p className="text-[12px] text-mist">Waiting on the Owner’s approval before this can go live.</p>
          )}
        </div>

        <ConfirmModal
          open={confirmPublish}
          onClose={() => setConfirmPublish(false)}
          onConfirm={publish}
          title="Publish this collaborative Vibe?"
          body="It appears in the feed credited to everyone on the board. Roles, suggestions and the full revision history stay attached."
          confirmLabel="Publish"
        />
      </ScreenOverlay>
    );
  }

  return (
    <ScreenOverlay title="Collaborative Vibes" onClose={onClose}>
      <p className="text-[12px] text-mist">Shared boards where a Vibe is built together. Boards are private until you publish, and the Owner can require approval first.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createBoard();
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value.slice(0, 40))}
          aria-label="New board title"
          placeholder="Name the board…"
          className="min-w-0 flex-1 rounded-full border border-[#d8f3ff]/30 bg-deep px-4 py-2.5 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
        />
        <button
          type="submit"
          disabled={titleDraft.trim() === ''}
          className="rounded-full border border-[#d8f3ff] bg-volt/25 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-volt/40 disabled:opacity-40"
        >
          New board
        </button>
      </form>

      {boards.length === 0 ? (
        <EmptyState icon={<Layers size={26} />} title="No boards yet" body="Open a board, invite people in, and let them shape the Vibe with you." />
      ) : (
        <ul className="mt-4 space-y-2.5">
          {boards.map((b) => (
            <li key={b.id}>
              <button
                type="button"
                onClick={() => setOpenId(b.id)}
                className="flex w-full items-center gap-3.5 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-4 py-3.5 text-left backdrop-blur-lg transition-colors hover:border-beam/60"
              >
                <span className="h-11 w-11 shrink-0 rounded-2xl" style={{ background: b.gradient }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">{b.title}</span>
                  <span className="block truncate text-[11px] text-mist">
                    {b.roles.length} people · {b.revisions.length} revisions · {b.presence.length > 0 ? `${b.presence.join(', ')} active` : 'quiet'}
                  </span>
                </span>
                <span className="shrink-0 rounded-full border border-[#d8f3ff]/20 bg-white/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wide text-mist">
                  {b.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <SectionCard title="How roles work" className="mt-6">
        <ul className="space-y-1.5 text-[12px] text-mist">
          {COLLAB_ROLE_CAPS.map((c) => (
            <li key={c.role}><strong className="text-ink">{c.role}</strong> — {c.can}</li>
          ))}
        </ul>
      </SectionCard>
    </ScreenOverlay>
  );
}
