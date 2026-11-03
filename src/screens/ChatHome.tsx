import { useState } from 'react';
import { Archive, MessageCircle, Search, Users } from 'lucide-react';

const FILTERS = ['All', 'Unread', 'Groups', 'Requests'] as const;

export function ChatHome() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');

  return (
    <div className="flex h-full flex-col">
      <header className="vado-topbar h-auto shrink-0 border-b border-white/10 px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold text-[#F5F7FF]">Inbox</h1>
            <p className="mt-1 text-xs text-[#AAB8D0]">Private conversations and group chats.</p>
          </div>
          <button type="button" disabled aria-label="New message (requires account)" className="rounded-full bg-[#287CFF] px-4 py-2.5 text-xs font-semibold text-white opacity-50">
            New message
          </button>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-5 sm:px-8">
        <label className="vado-glass-card flex items-center gap-2 rounded-xl px-3 py-2.5 text-[#AAB8D0]">
          <Search size={16} />
          <input disabled placeholder="Search conversations" className="w-full bg-transparent text-sm outline-none placeholder:text-[#AAB8D0]/70" />
        </label>
        <div role="tablist" aria-label="Inbox filter" className="scroll-slim mt-4 flex gap-2 overflow-x-auto">
          {FILTERS.map((item) => (
            <button type="button" role="tab" aria-selected={filter === item} key={item} onClick={() => setFilter(item)} className={`shrink-0 rounded-full border px-4 py-2 text-xs ${filter === item ? 'border-[#38C9FF]/40 bg-[#287CFF]/15 text-[#F5F7FF]' : 'border-white/10 text-[#AAB8D0] hover:text-white'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#91d2ff]/25 bg-[#1687ff]/10 text-[#38C9FF] shadow-[0_0_24px_rgba(22,135,255,.12)]">
            {filter === 'Groups' ? <Users size={24} /> : filter === 'Requests' ? <Archive size={24} /> : <MessageCircle size={24} />}
          </span>
          <h2 className="mt-5 text-lg font-semibold text-[#F5F7FF]">{filter === 'Requests' ? 'No message requests' : 'No conversations yet'}</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#AAB8D0]">
            Conversations will appear here when you start messaging. Messaging is not connected yet.
          </p>
        </div>
      </div>
    </div>
  );
}
