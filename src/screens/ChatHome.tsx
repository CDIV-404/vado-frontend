import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, LogOut, Pin, Send, Sparkles } from 'lucide-react';
import { CHATS, type Chat } from '../data/mock';
import { useToast } from '../components/Toast';
import { VadoChat } from '../components/VadoChat';

const VADO_CHAT: Chat = {
  id: 'vado',
  name: 'VADO AI',
  avatar: 'linear-gradient(135deg,#1687ff,#a78bfa 60%,#38c9ff)',
  last: 'Ask me for a caption, an idea, or a read on your stats.',
  time: 'pinned',
  unread: 0,
  messages: [],
};

export function ChatHome({
  onSignOut,
  session,
  onSeedCreator,
}: {
  onSignOut: () => void;
  session: string | null;
  onSeedCreator?: (text: string) => void;
}) {
  const [open, setOpen] = useState<Chat | null>(null);
  const list = [VADO_CHAT, ...CHATS];

  return (
    <div className="flex h-full w-full">
      <aside
        className={`h-full w-full min-w-0 flex-col border-r border-[#d8f3ff]/10 lg:w-[340px] lg:shrink-0 xl:w-[380px] ${
          open ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <header className="flex shrink-0 items-center justify-between px-4 pb-2 pt-4">
          <h2 className="text-[17px] font-semibold text-ink">Chats</h2>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('vado.session');
              onSignOut();
            }}
            className="inline-flex items-center gap-1 rounded-full border border-[#d8f3ff]/30 bg-glass px-3 py-1.5 text-[12px] text-mist transition-colors hover:text-ink"
          >
            <LogOut size={13} /> Sign out
          </button>
        </header>
        <ul className="scroll-slim min-h-0 flex-1 overflow-y-auto px-3 pb-4">
          {list.map((c, i) => (
            <motion.li key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <button
                type="button"
                onClick={() => setOpen(c)}
                aria-current={open?.id === c.id ? 'true' : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-white/5 ${
                  open?.id === c.id ? 'bg-white/5 lg:border lg:border-[#d8f3ff]/20 lg:bg-white/10' : ''
                }`}
              >
                <span className="relative h-11 w-11 shrink-0 rounded-full" style={{ background: c.avatar }} aria-hidden="true">
                  {c.id === 'vado' && (
                    <span className="absolute inset-0 flex items-center justify-center text-white">
                      <Sparkles size={18} />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-ink">
                    {c.name}
                    {c.id === 'vado' && (
                      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full border border-beam/40 bg-volt/15 px-1.5 py-0.5 align-middle text-[9px] font-medium uppercase tracking-wide text-beam">
                        <Pin size={8} /> Pinned
                      </span>
                    )}
                  </span>
                  <span className="block truncate text-[12px] text-mist">{c.last}</span>
                </span>
                <span className="flex flex-col items-end gap-1">
                  <span className="text-[11px] text-mist">{c.time}</span>
                  {c.unread > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-volt text-[10px] font-bold text-white shadow-glow">
                      {c.unread}
                    </span>
                  )}
                </span>
              </button>
            </motion.li>
          ))}
        </ul>
      </aside>
      <section className={`min-w-0 flex-1 ${open ? 'flex' : 'hidden lg:flex'}`}>
        {open ? (
          open.id === 'vado' ? (
            <div className="flex h-full w-full flex-col">
              <header className="flex shrink-0 items-center gap-2 border-b border-[#d8f3ff]/10 bg-deep/70 px-3 pb-2 pt-4 backdrop-blur-xl">
                <button type="button" onClick={() => setOpen(null)} aria-label="Back to chats" className="rounded-full p-1 text-mist hover:text-ink lg:hidden">
                  <ChevronLeft size={20} />
                </button>
                <span className="relative flex h-8 w-8 items-center justify-center rounded-full text-white" style={{ background: VADO_CHAT.avatar }} aria-hidden="true">
                  <Sparkles size={14} />
                </span>
                <span className="text-[14px] font-semibold text-ink">VADO AI</span>
                <span className="ml-auto mr-1 text-[11px] text-mist">assistant</span>
              </header>
              <VadoChat variant="pane" session={session} onSeedCreator={onSeedCreator} />
            </div>
          ) : (
            <Conversation key={open.id} chat={open} onBack={() => setOpen(null)} />
          )
        ) : (
          <div className="flex h-full flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <p className="text-[15px] font-medium text-mist">Select a chat to start vibing</p>
          </div>
        )}
      </section>
    </div>
  );
}

function Conversation({ chat, onBack }: { chat: Chat; onBack: () => void }) {
  const toast = useToast();
  const [messages, setMessages] = useState(chat.messages);
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((m) => [...m, { from: 'me', text }]);
    setDraft('');
    window.setTimeout(() => {
      setMessages((m) => [...m, { from: 'them', text: '👀 on it — sending vibes shortly' }]);
    }, 900);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <header className="flex shrink-0 items-center gap-2 border-b border-[#d8f3ff]/10 bg-deep/70 px-3 pb-2 pt-4 backdrop-blur-xl">
        <button type="button" onClick={onBack} aria-label="Back to chats" className="rounded-full p-1 text-mist hover:text-ink lg:hidden">
          <ChevronLeft size={20} />
        </button>
        <span className="h-8 w-8 rounded-full" style={{ background: chat.avatar }} aria-hidden="true" />
        <span className="text-[14px] font-semibold text-ink">{chat.name}</span>
      </header>
      <div className="scroll-slim min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-2">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <span
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-[13px] xl:max-w-[60%] ${
                  m.from === 'me'
                    ? 'rounded-br-md bg-gradient-to-r from-volt to-beam text-white'
                    : 'rounded-bl-md border border-[#d8f3ff]/20 bg-glass text-ink backdrop-blur-lg'
                }`}
              >
                {m.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
      <form onSubmit={send} className="flex shrink-0 gap-2 px-3 pb-4 pt-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Message…"
          aria-label="Message"
          className="min-w-0 flex-1 rounded-full border border-[#d8f3ff]/30 bg-volt/10 px-4 py-2.5 text-sm text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
        />
        <button
          type="submit"
          aria-label="Send message"
          onClick={() => draft.trim() && toast('Message sent')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-volt to-beam text-white shadow-glow"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
