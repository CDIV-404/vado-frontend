import { motion } from 'framer-motion';
import { Bookmark, Eye, Heart, MessageCircle, Play, Repeat2, Share2, Sparkles, Users } from 'lucide-react';
import { fmt, type Vibe } from '../data/mock';

export function VibeCard({
  vibe,
  index,
  reduce,
  liked,
  saved,
  onToggleLike,
  onToggleSave,
  onComments,
  onShare,
  onOpenProfile,
  onRemix,
}: {
  vibe: Vibe;
  index: number;
  reduce: boolean;
  liked: boolean;
  saved: boolean;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onComments: () => void;
  onShare: () => void;
  onOpenProfile: (handle: string) => void;
  onRemix: () => void;
}) {
  const isTextTile = vibe.format === 'quote' || vibe.format === 'text';
  const canRemix = vibe.allowRemix !== false;
  return (
    <motion.li
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: reduce ? 0 : Math.min(index, 8) * 0.05, duration: 0.35, ease: 'easeOut' }}
      className="flex flex-col overflow-hidden rounded-3xl border border-[#d8f3ff]/25 bg-glass backdrop-blur-lg"
    >
      <div className="flex items-center gap-2.5 px-3.5 pt-3">
        <button
          type="button"
          onClick={() => onOpenProfile(vibe.handle)}
          aria-label={`Open ${vibe.creator} profile`}
          className="h-9 w-9 shrink-0 rounded-full ring-1 ring-[#d8f3ff]/30 transition-transform hover:scale-105"
          style={{ background: vibe.gradient }}
        />
        <button
          type="button"
          onClick={() => onOpenProfile(vibe.handle)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="truncate text-[13px] font-semibold text-ink">{vibe.creator}</p>
          <p className="truncate text-[11px] text-mist">{vibe.handle} · {vibe.time}</p>
        </button>
        {vibe.mine ? (
          <span className="rounded-full border border-[#d8f3ff]/30 bg-white/10 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink">
            {vibe.visibility === 'private' ? 'Private' : vibe.visibility === 'followers' ? 'Followers' : 'You'}
          </span>
        ) : (
          <span className="rounded-full border border-beam/30 bg-volt/15 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-beam">
            {vibe.category}
          </span>
        )}
      </div>

      {vibe.aiGenerated && (
        <span className="mx-3.5 mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-[#d8f3ff]/30 bg-white/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-mist">
          <Sparkles size={11} className="text-beam" /> AI-assisted
        </span>
      )}

      {vibe.remixedFrom && (
        <button
          type="button"
          onClick={() => onOpenProfile(vibe.remixedFrom!)}
          className="mx-3.5 mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-beam/30 bg-volt/10 px-2.5 py-1 text-[11px] font-medium text-beam transition-colors hover:bg-volt/20"
        >
          <Repeat2 size={12} /> Remixed from {vibe.remixedFrom}
        </button>
      )}

      {vibe.coCreatedWith && vibe.coCreatedWith.length > 0 && (
        <button
          type="button"
          onClick={() => onOpenProfile(vibe.coCreatedWith![0])}
          className="mx-3.5 mt-2 inline-flex w-fit items-center gap-1.5 rounded-full border border-beam/30 bg-volt/10 px-2.5 py-1 text-[11px] font-medium text-beam transition-colors hover:bg-volt/20"
        >
          <Users size={12} /> Made with {vibe.coCreatedWith.join(', ')}
        </button>
      )}

      <div
        className={`relative mx-3.5 mt-2.5 overflow-hidden rounded-2xl ${isTextTile ? 'flex min-h-36 items-center justify-center px-4 py-6' : 'h-40'}`}
        style={{ background: vibe.gradient }}
        aria-hidden="true"
      >
        {vibe.format === 'video' && (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-sm">
              <Play size={20} className="ml-0.5" fill="currentColor" />
            </span>
          </span>
        )}
        {isTextTile && (
          <p className="text-center text-[16px] font-medium leading-snug text-white drop-shadow">{vibe.caption}</p>
        )}
        {vibe.format === 'mood' && (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <span className="text-[22px] font-semibold uppercase tracking-[0.2em] text-white drop-shadow">{vibe.mood}</span>
            <span className="text-[11px] text-white/70">mood card</span>
          </span>
        )}
      </div>

      {!isTextTile && (
        <p className="px-3.5 pt-2.5 text-[13px] leading-relaxed text-ink">{vibe.caption}</p>
      )}
      {vibe.hashtags.length > 0 && (
        <p className="px-3.5 pt-1.5 text-[11px] text-sky">
          {vibe.hashtags.map((h) => (
            <span key={h} className="mr-1.5">{h}</span>
          ))}
        </p>
      )}

      <div className="mt-auto flex items-center gap-1 px-2.5 py-2.5">
        <ActionBtn
          label={liked ? `Unlike (${fmt(vibe.likes + (liked ? 1 : 0))})` : `Like (${fmt(vibe.likes)})`}
          active={liked}
          onClick={onToggleLike}
        >
          <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
        </ActionBtn>
        <span className="mr-1 text-[11px] text-mist">{fmt(vibe.likes + (liked ? 1 : 0))}</span>
        <ActionBtn label={`Comments (${fmt(vibe.comments)})`} onClick={onComments}>
          <MessageCircle size={16} />
        </ActionBtn>
        <span className="mr-1 text-[11px] text-mist">{fmt(vibe.comments)}</span>
        <ActionBtn label={`Share (${fmt(vibe.shares)})`} onClick={onShare}>
          <Share2 size={16} />
        </ActionBtn>
        <span className="mr-1 text-[11px] text-mist">{fmt(vibe.shares)}</span>
        <span className="flex-1" />
        <span className="mr-1.5 inline-flex items-center gap-1 text-[11px] text-mist">
          <Eye size={13} /> {fmt(vibe.views)}
        </span>
        <ActionBtn label={saved ? 'Remove from saved' : 'Save'} active={saved} onClick={onToggleSave}>
          <Bookmark size={16} fill={saved ? 'currentColor' : 'none'} />
        </ActionBtn>
        {canRemix && (
          <ActionBtn label={`Remix ${vibe.caption.slice(0, 24)}…`} onClick={onRemix}>
            <Repeat2 size={16} />
          </ActionBtn>
        )}
      </div>
    </motion.li>
  );
}

function ActionBtn({
  label,
  onClick,
  active = false,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
        active ? 'text-beam hover:text-beam' : 'text-mist hover:bg-white/10 hover:text-ink'
      }`}
    >
      {children}
    </button>
  );
}
