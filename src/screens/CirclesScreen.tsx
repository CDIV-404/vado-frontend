import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, Lock, Sparkles, Trash2, UserPlus, UsersRound } from 'lucide-react';
import {
  CIRCLE_DISCOVERY, CIRCLE_EVENTS, CIRCLE_POSTS, CIRCLE_ROLES, fmt,
  seedCircles, type Circle, type CirclePost,
} from '../data/mock';
import { load, save } from '../lib/store';
import { useToast } from '../components/Toast';
import { ConfirmModal, EmptyState, ScreenOverlay, SectionCard } from '../components/ui';

type Moderation = Record<string, 'reported' | 'removed'>;

export function CirclesScreen({ session, onClose }: { session: string | null; onClose: () => void }) {
  const toast = useToast();
  const [circles, setCircles] = useState<Circle[]>(() => {
    const stored = load<Circle[] | null>('circles', null);
    if (stored) return stored;
    const seeded = seedCircles();
    save('circles', seeded);
    return seeded;
  });
  const [joinedIds, setJoinedIds] = useState<string[]>(() => load<string[]>('circlesJoined', []));
  const [openId, setOpenId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [postDraft, setPostDraft] = useState('');
  const [localPosts, setLocalPosts] = useState<Record<string, CirclePost[]>>(() => load<Record<string, CirclePost[]>>('circlePosts', {}));
  const [moderation, setModeration] = useState<Moderation>(() => load<Moderation>('circleModeration', {}));
  const [rsvp, setRsvp] = useState<string[]>(() => load<string[]>('circleRsvp', []));
  const [confirm, setConfirm] = useState<{ kind: 'leave' | 'delete' | 'remove' | 'report'; id: string } | null>(null);

  const me = `@${(session ?? 'you').toLowerCase().replace(/\s+/g, '.')}`;
  const open = circles.find((c) => c.id === openId) ?? null;
  const canModerate = open ? open.role === 'Owner' || open.role === 'Moderator' : false;

  const persistCircles = (next: Circle[]) => {
    setCircles(next);
    save('circles', next);
  };

  const patchPosts = (circleId: string, next: CirclePost[]) => {
    const merged = { ...localPosts, [circleId]: next };
    setLocalPosts(merged);
    save('circlePosts', merged);
  };

  const patchMod = (next: Moderation) => {
    setModeration(next);
    save('circleModeration', next);
  };

  const patchJoined = (next: string[]) => {
    setJoinedIds(next);
    save('circlesJoined', next);
  };

  const createCircle = () => {
    const name = nameDraft.trim();
    if (!name) return;
    const c: Circle = {
      id: `c-${Date.now()}`,
      name: name.slice(0, 40),
      desc: 'A circle you started. Set the tone.',
      gradient: 'linear-gradient(135deg,#1687ff,#a78bfa 55%,#38c9ff)',
      members: 1,
      role: 'Owner',
      privacy: 'private',
      category: 'Art',
      active: 'now',
    };
    persistCircles([c, ...circles]);
    setNameDraft('');
    setOpenId(c.id);
    toast('Circle created — private by default');
  };

  const join = (id: string, name: string) => {
    patchJoined([...joinedIds, id]);
    const disc = CIRCLE_DISCOVERY.find((d) => d.id === id);
    if (disc) persistCircles([...circles, {
      id: disc.id, name: disc.name, desc: disc.desc, gradient: 'linear-gradient(135deg,#0f3f66,#38c9ff)',
      members: disc.members, role: 'Member', privacy: 'public', category: disc.category, active: 'now',
    }]);
    toast(`Joined ${name}`);
  };

  const postsFor = (circleId: string): CirclePost[] =>
    [...(localPosts[circleId] ?? []), ...(CIRCLE_POSTS[circleId] ?? [])].map((p) => ({
      ...p,
      reportState: moderation[p.id] ?? p.reportState,
    }));

  const rsvpToggle = (eventId: string, title: string) => {
    const next = rsvp.includes(eventId) ? rsvp.filter((x) => x !== eventId) : [...rsvp, eventId];
    setRsvp(next);
    save('circleRsvp', next);
    toast(rsvp.includes(eventId) ? `RSVP withdrawn from “${title}”` : `You're going to “${title}”`);
  };

  const aiTake = useMemo(() => {
    if (!open) return '';
    const posts = postsFor(open.id).filter((p) => p.reportState !== 'removed');
    const top = posts[0];
    const events = CIRCLE_EVENTS[open.id] ?? [];
    return `${open.name.toLowerCase()} is reading ${top ? `around “${top.text.slice(0, 42)}…”` : 'quiet today'}. `
      + `${events.length ? `${events.length} upcoming event — good moment to post something that answers it. ` : 'A single frame beats a paragraph here. '} `
      + 'Match the circle’s tone and credit whoever inspired you.';
  }, [open, localPosts, moderation, rsvp]);

  if (open) {
    const posts = postsFor(open.id);
    const events = CIRCLE_EVENTS[open.id] ?? [];
    const isMember = open.role === 'Member';
    return (
      <ScreenOverlay title={open.name} onClose={() => { setOpenId(null); setPostDraft(''); }}>
        <button
          type="button"
          onClick={() => { setOpenId(null); setPostDraft(''); }}
          className="mb-3 inline-flex items-center gap-1.5 text-[12px] text-mist transition-colors hover:text-ink"
        >
          <ChevronLeft size={14} /> All circles
        </button>

        <div className="flex items-center gap-3">
          <span className="h-12 w-12 shrink-0 rounded-2xl" style={{ background: open.gradient }} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] text-ink">{open.desc}</p>
            <p className="text-[11px] text-mist">{fmt(open.members)} members · active {open.active} · {open.category}</p>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
            open.privacy === 'private' ? 'border-[#d8f3ff]/25 bg-white/5 text-mist' : 'border-beam/40 bg-volt/15 text-beam'
          }`}>
            {open.privacy === 'private' && <Lock size={10} />} {open.privacy}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-beam/30 bg-volt/15 px-3 py-1 text-[11px] font-medium text-beam">You: {open.role}</span>
          {open.privacy === 'private' && (
            <button
              type="button"
              aria-pressed={open.privacy === 'private'}
              onClick={() => {
                persistCircles(circles.map((c) => (c.id === open.id ? { ...c, privacy: 'public' } : c)));
                toast('Circle is now public — anyone can find and request to join');
              }}
              className="rounded-full border border-[#d8f3ff]/25 bg-glass px-3 py-1 text-[11px] text-mist transition-colors hover:text-ink"
            >
              Make public
            </button>
          )}
          <span className="flex-1" />
          <button
            type="button"
            onClick={() => setConfirm({ kind: open.role === 'Owner' ? 'delete' : 'leave', id: open.id })}
            className="rounded-full border border-[#d8f3ff]/25 bg-glass px-3.5 py-1.5 text-[11px] text-mist transition-colors hover:text-ink"
          >
            {open.role === 'Owner' ? 'Delete circle' : 'Leave circle'}
          </button>
        </div>

        <SectionCard title="Your role" className="mt-4">
          <ul className="space-y-1.5">
            {CIRCLE_ROLES.map((r) => (
              <li key={r.role} className={`flex gap-2 text-[12px] ${r.role === open.role ? 'text-ink' : 'text-mist'}`}>
                <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${r.role === open.role ? 'bg-beam' : 'bg-[#d8f3ff]/30'}`} aria-hidden="true" />
                <span><strong className="font-semibold">{r.role}:</strong> {r.can}</span>
              </li>
            ))}
          </ul>
        </SectionCard>

        {!isMember && (
          <div className="mt-5">
            <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
              <Sparkles size={12} /> Circle AI read
            </p>
            <p className="rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3.5 py-3 text-[12px] leading-relaxed text-ink">{aiTake}</p>
          </div>
        )}

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Circle feed</p>
          {posts.length === 0 ? (
            <EmptyState icon={<UsersRound size={26} />} title="No posts yet" body="Be the first — keep it in tone with the circle." />
          ) : (
            <ul className="space-y-2.5" aria-label="Circle posts">
              {posts.map((p) => {
                if (p.reportState === 'removed') {
                  return (
                    <li key={p.id} className="rounded-2xl border border-dashed border-[#d8f3ff]/20 px-3.5 py-3 text-[12px] text-mist">
                      Removed by a moderator — the author was notified.
                    </li>
                  );
                }
                return (
                  <li key={p.id} className="rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-ink">
                        {p.author} <span className="font-normal text-mist">{p.handle}</span>
                      </span>
                      <span className="text-[11px] text-mist">{p.time}</span>
                    </div>
                    <p className="mt-1 text-[13px] leading-snug text-ink">{p.text}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {p.reportState === 'reported' && (
                        <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-200">
                          Reported — under review
                        </span>
                      )}
                      <span className="flex-1" />
                      <button
                        type="button"
                        onClick={() => setConfirm({ kind: 'report', id: p.id })}
                        className="rounded-full border border-[#d8f3ff]/25 bg-glass px-3 py-1 text-[11px] text-mist transition-colors hover:text-ink"
                      >
                        Report
                      </button>
                      {canModerate && p.reportState !== 'reported' && (
                        <button
                          type="button"
                          aria-label={`Remove post by ${p.handle}`}
                          onClick={() => setConfirm({ kind: 'remove', id: p.id })}
                          className="rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1 text-[11px] text-red-200 transition-colors hover:bg-red-500/25"
                        >
                          <Trash2 size={11} className="mr-1 inline" /> Remove
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const text = postDraft.trim();
            if (!text) return;
            const post: CirclePost = { id: `lp-${Date.now()}`, author: session ?? 'You', handle: me, text: text.slice(0, 240), time: 'now' };
            patchPosts(open.id, [post, ...(localPosts[open.id] ?? [])]);
            setPostDraft('');
            toast('Posted to circle');
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={postDraft}
            onChange={(e) => setPostDraft(e.target.value.slice(0, 240))}
            aria-label="New circle post"
            placeholder={`Post to ${open.name}…`}
            className="min-w-0 flex-1 rounded-full border border-[#d8f3ff]/30 bg-deep px-4 py-2.5 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
          />
          <button
            type="submit"
            className="rounded-full border border-[#d8f3ff] bg-volt/25 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-volt/40"
          >
            Post
          </button>
        </form>

        <div className="mt-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Circle events</p>
          {events.length === 0 ? (
            <p className="text-[12px] text-mist">No events scheduled in this circle yet.</p>
          ) : (
            <ul className="space-y-2.5">
              {events.map((ev) => {
                const going = rsvp.includes(ev.id);
                return (
                  <li key={ev.id} className="flex items-center gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3.5 py-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d8f3ff]/25 bg-white/5 text-beam">
                      <CalendarDays size={15} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] text-ink">{ev.title}</span>
                      <span className="block text-[11px] text-mist">{ev.when} · hosted by {ev.host} · {fmt(ev.rsvp + (going ? 1 : 0))} going</span>
                    </span>
                    <button
                      type="button"
                      aria-pressed={going}
                      onClick={() => rsvpToggle(ev.id, ev.title)}
                      className={`rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition-colors ${
                        going ? 'border-[#d8f3ff]/25 bg-glass text-mist hover:text-ink' : 'border-[#d8f3ff] bg-volt/25 text-white hover:bg-volt/40'
                      }`}
                    >
                      {going ? 'Cancel RSVP' : "I'm going"}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <ConfirmModal
          open={confirm?.kind === 'leave'}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            persistCircles(circles.filter((c) => c.id !== open.id));
            setConfirm(null);
            setOpenId(null);
            toast('You left the circle');
          }}
          title="Leave this circle?"
          body="You lose access to its feed and events until you are invited back."
          confirmLabel="Leave circle"
        />
        <ConfirmModal
          open={confirm?.kind === 'delete'}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            persistCircles(circles.filter((c) => c.id !== open.id));
            setConfirm(null);
            setOpenId(null);
            toast('Circle deleted');
          }}
          title="Delete this circle?"
          body="This removes the circle, its feed and its events for every member on this device. It cannot be undone."
          confirmLabel="Delete circle"
          danger
        />
        <ConfirmModal
          open={confirm?.kind === 'remove'}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            const id = confirm!.id;
            const next = { ...moderation, [id]: 'removed' as const };
            patchMod(next);
            const own = (localPosts[open.id] ?? []).filter((p) => p.id !== id);
            if (own.length !== (localPosts[open.id] ?? []).length) patchPosts(open.id, own);
            setConfirm(null);
            toast('Post removed and author notified');
          }}
          title="Remove this post?"
          body="Moderation actions are logged and the author is told what happened and why."
          confirmLabel="Remove post"
          danger
        />
        <ConfirmModal
          open={confirm?.kind === 'report'}
          onClose={() => setConfirm(null)}
          onConfirm={() => {
            patchMod({ ...moderation, [confirm!.id]: 'reported' });
            setConfirm(null);
            toast('Reported to circle moderators');
          }}
          title="Report this post?"
          body="It goes to this circle's moderators for review. Nothing is deleted yet."
          confirmLabel="Report post"
        />
      </ScreenOverlay>
    );
  }

  return (
    <ScreenOverlay title="Community Circles" onClose={onClose}>
      <p className="text-[12px] text-mist">Small groups around a shared mood. New circles are private — only members see the feed.</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createCircle();
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value.slice(0, 40))}
          aria-label="New circle name"
          placeholder="Name your circle…"
          className="min-w-0 flex-1 rounded-full border border-[#d8f3ff]/30 bg-deep px-4 py-2.5 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
        />
        <button
          type="submit"
          disabled={nameDraft.trim() === ''}
          className="rounded-full border border-[#d8f3ff] bg-volt/25 px-5 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-volt/40 disabled:opacity-40"
        >
          Create
        </button>
      </form>

      {circles.length === 0 ? (
        <EmptyState icon={<UsersRound size={26} />} title="No circles yet" body="Start one around a mood, or join a circle from discovery below." />
      ) : (
        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {circles.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setOpenId(c.id)}
                className="flex w-full items-center gap-3.5 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-4 py-3.5 text-left backdrop-blur-lg transition-colors hover:border-beam/60"
              >
                <span className="h-11 w-11 shrink-0 rounded-2xl" style={{ background: c.gradient }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">{c.name}</span>
                  <span className="block truncate text-[11px] text-mist">{c.desc}</span>
                  <span className="mt-0.5 block text-[11px] text-mist">{fmt(c.members)} members · {c.category}</span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                    c.privacy === 'private' ? 'border-[#d8f3ff]/25 bg-white/5 text-mist' : 'border-beam/40 bg-volt/15 text-beam'
                  }`}>
                    {c.privacy}
                  </span>
                  <span className="rounded-full border border-[#d8f3ff]/20 bg-white/5 px-2.5 py-0.5 text-[10px] text-mist">{c.role}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <SectionCard title="Discover circles" className="mt-6">
        <ul className="space-y-2.5">
          {CIRCLE_DISCOVERY.filter((d) => !joinedIds.includes(d.id)).map((d) => (
            <li key={d.id} className="flex items-center gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3.5 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-semibold text-ink">{d.name}</span>
                <span className="block truncate text-[11px] text-mist">{d.desc} · {fmt(d.members)} members · {d.category}</span>
              </span>
              <button
                type="button"
                onClick={() => join(d.id, d.name)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#d8f3ff] bg-volt/25 px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-volt/40"
              >
                <UserPlus size={12} /> Join
              </button>
            </li>
          ))}
          {joinedIds.length > 0 && (
            <li className="text-[11px] text-mist">Joined {joinedIds.length} circle{joinedIds.length === 1 ? '' : 's'} from discovery — they are in your list above.</li>
          )}
        </ul>
      </SectionCard>
    </ScreenOverlay>
  );
}
