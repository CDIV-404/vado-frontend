import { useState } from 'react';
import { Bell, Play, Plus, Search, Video } from 'lucide-react';

type FeedTab = 'following' | 'global';

export function VibesFeed({
  session,
  onCreate,
  onSearch,
  onRequireAuth,
}: {
  session: string | null;
  onCreate: () => void;
  onSearch: () => void;
  onRequireAuth: (action: string) => void;
}) {
  const [tab, setTab] = useState<FeedTab>('global');

  return (
    <div className="flex h-full flex-col">
      <header className="vado-feed-tabs shrink-0 border-b border-white/10 bg-[#080B18]/35 px-2 py-2 backdrop-blur-xl">
        <div className="mx-auto flex w-full items-center gap-1">
          <div className="flex flex-1 items-center gap-1">
            {(['global', 'following'] as const).map((item) => {
              const gated = item === 'following' && !session;
              return (
                <button
                  type="button"
                  key={item}
                  role="tab"
                  aria-selected={tab === item}
                  onClick={() => {
                    if (gated) onRequireAuth('view your Following feed');
                    else setTab(item);
                  }}
                  className={`relative px-2.5 py-2 text-xs font-medium ${item === tab ? 'text-[#F5F7FF]' : 'text-[#AAB8D0] hover:text-white'}`}
                >
                  {item === 'global' ? 'For You' : 'Following'}
                  {item === tab && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#38C9FF]" />}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={onSearch} aria-label="Search" className="vado-icon-button">
            <Search size={16} />
          </button>
          <button type="button" onClick={() => onRequireAuth('view notifications')} aria-label="Notifications" className="vado-icon-button">
            <Bell size={16} />
          </button>
          <button type="button" onClick={() => onRequireAuth('view your profile')} aria-label="Open profile" className="h-7 w-7 shrink-0 rounded-full border border-[#91d2ff]/35 bg-gradient-to-br from-[#1687ff]/50 to-[#8057ff]/30 text-[#f1f5fc] hover:border-[#38C9FF]/70">
            <span className="sr-only">Guest profile</span>
          </button>
        </div>
      </header>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-7">
        <div className="mx-auto flex min-h-full w-full max-w-5xl flex-col items-center justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-[25px] border border-[#38C9FF]/20 bg-gradient-to-br from-[#287CFF]/15 to-[#8057FF]/10 text-[#38C9FF] shadow-[inset_0_1px_0_rgba(255,255,255,.12),0_0_28px_rgba(22,135,255,.14)] sm:h-24 sm:w-24">
            <Video size={35} strokeWidth={1.4} />
            <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full border-4 border-[#080B18] bg-[#287CFF] text-white">
              <Play size={14} fill="currentColor" />
            </span>
          </div>
          <p className="mt-7 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#38C9FF]">VADO · {tab === 'global' ? 'For You' : 'Following'}</p>
          <h1 className="mt-3 max-w-xl text-center text-xl font-semibold leading-tight text-[#F5F7FF] sm:text-2xl">
            Your next favorite video hasn’t arrived yet.
          </h1>
          <p className="mt-3 max-w-lg text-center text-sm leading-6 text-[#AAB8D0]">
            {tab === 'global'
              ? 'There are no public videos available right now. The feed will fill with real creator posts when VADO content services are connected.'
              : 'No videos from followed creators are available yet. Follow creators when real content becomes available.'}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={onSearch} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-[#F5F7FF] transition-colors hover:border-[#38C9FF]/50 hover:bg-white/5">
              <Search size={16} /> Explore Discover
            </button>
            <button type="button" onClick={onCreate} className="inline-flex items-center gap-2 rounded-full bg-[#287CFF] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#1769e8]">
              <Plus size={16} /> Create a video
            </button>
          </div>
          <p className="mt-5 text-center text-[11px] text-[#AAB8D0]/75">
            Creator posts and interactions will appear when VADO content services are connected.
          </p>
        </div>
      </div>
    </div>
  );
}
