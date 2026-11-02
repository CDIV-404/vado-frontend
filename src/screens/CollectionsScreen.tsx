import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Layers, Sparkles, Trash2 } from 'lucide-react';
import { GLOBAL_VIBES, seedCollections, type Collection, type Vibe } from '../data/mock';
import { load, save } from '../lib/store';
import { useToast } from '../components/Toast';
import { ConfirmModal, EmptyState, ScreenOverlay } from '../components/ui';

function defaultName(n: number): string {
  return n === 0 ? 'Untitled board' : ['Night drive energy', 'Things that calm me down', 'Third buffer'][Math.min(n - 1, 2)];
}

export function CollectionsScreen({ published, onClose }: { published: Vibe[]; onClose: () => void }) {
  const toast = useToast();
  const [collections, setCollections] = useState<Collection[]>(() => {
    const stored = load<Collection[] | null>('collections', null);
    if (stored) return stored;
    const seeded = seedCollections();
    save('collections', seeded);
    return seeded;
  });
  const [openId, setOpenId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  const allVibes = useMemo(() => [...published, ...GLOBAL_VIBES], [published]);
  const byId = useMemo(() => new Map(allVibes.map((v) => [v.id, v])), [allVibes]);
  const open = collections.find((c) => c.id === openId) ?? null;

  const persist = (next: Collection[]) => {
    setCollections(next);
    save('collections', next);
  };

  const createCollection = () => {
    const name = nameDraft.trim() || defaultName(collections.length);
    const c: Collection = { id: `col-${Date.now()}`, name: name.slice(0, 40), vibeIds: [], visibility: 'private', createdBy: 'you', role: 'Owner' };
    persist([c, ...collections]);
    setNameDraft('');
    setOpenId(c.id);
    toast('Collection created — private by default');
  };

  const patchOpen = (patch: Partial<Collection>) => {
    if (!open) return;
    persist(collections.map((c) => (c.id === open.id ? { ...c, ...patch } : c)));
  };

  const move = (index: number, dir: -1 | 1) => {
    if (!open) return;
    const ids = [...open.vibeIds];
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    patchOpen({ vibeIds: ids });
  };

  const onDrop = (targetIndex: number) => {
    if (!open || !dragId || !open.vibeIds.includes(dragId)) return;
    const ids = open.vibeIds.filter((x) => x !== dragId);
    const at = Math.min(targetIndex, ids.length);
    ids.splice(at, 0, dragId);
    patchOpen({ vibeIds: ids });
    setDragId(null);
  };

  const suggestIds = useMemo(() => {
    if (!open) return [];
    const members = open.vibeIds.map((id) => byId.get(id)).filter(Boolean) as Vibe[];
    const moods = new Set(members.map((v) => v.mood));
    const cats = new Set(members.map((v) => v.category));
    const tags = new Set(members.flatMap((v) => v.hashtags));
    const nameWords = new Set(open.name.toLowerCase().split(/\s+/).filter((w) => w.length > 3));
    return allVibes
      .filter((v) => !open.vibeIds.includes(v.id))
      .map((v) => {
        const nameHits = [...nameWords].filter((w) => `${v.caption} ${v.mood} ${v.category}`.toLowerCase().includes(w)).length;
        const memberScore =
          (moods.has(v.mood) ? 2 : 0) + (cats.has(v.category) ? 1 : 0) + v.hashtags.filter((h) => tags.has(h)).length;
        const fallback = members.length === 0 && nameHits === 0 ? Math.min(3, v.views / 4000) : 0;
        return { v, score: memberScore + nameHits + fallback };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.v);
  }, [open, allVibes, byId]);

  if (open) {
    const members = open.vibeIds.map((id) => byId.get(id)).filter(Boolean) as Vibe[];
    return (
      <ScreenOverlay title={open.name} onClose={() => setOpenId(null)}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-beam/30 bg-volt/15 px-3 py-1 text-[11px] font-medium text-beam">{open.role}</span>
          {(['private', 'public', 'collab'] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={open.visibility === v}
              onClick={() => {
                patchOpen({ visibility: v });
                toast(v === 'private' ? 'Board is private again' : `Board set to ${v}`);
              }}
              className={`rounded-full border px-3 py-1 text-[11px] capitalize transition-colors ${
                open.visibility === v ? 'border-beam bg-volt/25 text-white' : 'border-[#d8f3ff]/25 bg-glass text-mist hover:text-ink'
              }`}
            >
              {v === 'collab' ? 'collaborative' : v}
            </button>
          ))}
          <span className="flex-1" />
          <button
            type="button"
            aria-label="Delete collection"
            onClick={() => setConfirmDelete(open.id)}
            className="rounded-full border border-red-400/50 bg-red-500/10 p-2 text-red-200 transition-colors hover:bg-red-500/25"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-mist">
          {open.visibility === 'private' ? 'Only you can see this board.' : open.visibility === 'public' ? 'Anyone can browse this board.' : 'Members can suggest; you approve before it lands.'}
        </p>

        {members.length === 0 ? (
          <EmptyState icon={<Layers size={26} />} title="Empty board" body="Add vibes from the suggestions below — then drag to set the order." />
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Collection tiles, reorderable">
            {members.map((v, i) => (
              <li
                key={v.id}
                draggable
                onDragStart={() => setDragId(v.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(i)}
                className={`group relative overflow-hidden rounded-2xl border transition-colors ${
                  dragId === v.id ? 'border-beam' : 'border-[#d8f3ff]/25'
                }`}
              >
                <span className="flex h-24 items-end p-2" style={{ background: v.gradient }} aria-hidden="true" />
                <p className="truncate bg-deep/80 px-2 py-1.5 text-[11px] text-ink">{v.caption}</p>
                <span className="absolute left-1.5 top-1.5 rounded-full bg-black/50 px-1.5 text-[10px] font-semibold text-white">{i + 1}</span>
                <span className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                  <button type="button" aria-label={`Move ${v.caption.slice(0, 16)} up`} onClick={() => move(i, -1)} className="rounded-full bg-black/55 p-1 text-white hover:bg-volt/70">
                    <ChevronUp size={12} />
                  </button>
                  <button type="button" aria-label={`Move ${v.caption.slice(0, 16)} down`} onClick={() => move(i, 1)} className="rounded-full bg-black/55 p-1 text-white hover:bg-volt/70">
                    <ChevronDown size={12} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
            <Sparkles size={12} /> AI suggestions
          </p>
          {suggestIds.length === 0 ? (
            <p className="text-[12px] text-mist">Nothing matches this board’s mood yet — add a vibe and suggestions will follow.</p>
          ) : (
            <ul className="space-y-2">
              {suggestIds.map((v) => (
                <li key={v.id} className="flex items-center gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-glass p-2.5">
                  <span className="h-10 w-10 shrink-0 rounded-xl" style={{ background: v.gradient }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] text-ink">{v.caption}</span>
                    <span className="block text-[11px] text-mist">{v.handle} · {v.mood}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      patchOpen({ vibeIds: [...open.vibeIds, v.id] });
                      toast('Added to board');
                    }}
                    className="rounded-full border border-[#d8f3ff]/40 bg-volt/20 px-3.5 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-volt/35"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <ConfirmModal
          open={confirmDelete === open.id}
          onClose={() => setConfirmDelete(null)}
          onConfirm={() => {
            persist(collections.filter((c) => c.id !== open.id));
            setConfirmDelete(null);
            setOpenId(null);
            toast('Collection deleted');
          }}
          title="Delete this collection?"
          body="The board and its order are removed from this device. The vibes themselves stay in the feed."
          confirmLabel="Delete collection"
          danger
        />
      </ScreenOverlay>
    );
  }

  return (
    <ScreenOverlay title="Collections" onClose={onClose}>
      <p className="text-[12px] text-mist">Mood boards of saved and published vibes. New boards start private.</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          createCollection();
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value.slice(0, 40))}
          placeholder="New board name…"
          aria-label="New collection name"
          className="min-w-0 flex-1 rounded-full border border-[#d8f3ff]/30 bg-deep px-4 py-2.5 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
        />
        <button
          type="submit"
          className="rounded-full border border-[#d8f3ff] bg-volt/25 px-5 py-2.5 text-[13px] font-semibold text-white shadow-glow-in transition-colors hover:bg-volt/40"
        >
          Create
        </button>
      </form>

      {collections.length === 0 ? (
        <EmptyState icon={<Layers size={26} />} title="No boards yet" body="Collect vibes into a mood board — private, public or collaborative." />
      ) : (
        <ul className="mt-4 space-y-2.5">
          {collections.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => setOpenId(c.id)}
                className="flex w-full items-center gap-3.5 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-4 py-3.5 text-left backdrop-blur-lg transition-colors hover:border-beam/60"
              >
                <span className="flex -space-x-2" aria-hidden="true">
                  {c.vibeIds.slice(0, 3).map((id) => {
                    const v = byId.get(id);
                    return <span key={id} className="h-8 w-8 rounded-lg border border-[#0a1f38]" style={{ background: v?.gradient ?? '#334155' }} />;
                  })}
                  {c.vibeIds.length === 0 && <span className="h-8 w-8 rounded-lg border border-[#d8f3ff]/25 bg-white/5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">{c.name}</span>
                  <span className="block text-[11px] text-mist">{c.vibeIds.length} vibes · {c.role}</span>
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
                    c.visibility === 'private' ? 'border-[#d8f3ff]/25 bg-white/5 text-mist' : c.visibility === 'public' ? 'border-beam/40 bg-volt/15 text-beam' : 'border-[#4ade80]/40 bg-[#4ade80]/10 text-[#86efac]'
                  }`}
                >
                  {c.visibility}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </ScreenOverlay>
  );
}
