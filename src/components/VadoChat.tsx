import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bookmark, Copy, RotateCcw, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { PERSONALITIES, SUGGESTED_PROMPTS } from '../data/mock';
import { load, save } from '../lib/store';
import { greeting, personalityLine, vadoReply, type AiPersonality, type AiQuickAction } from '../lib/ai';
import { useToast } from './Toast';

export type ChatMsg = { from: 'me' | 'ai'; text: string; actions?: AiQuickAction[] };

function initialHistory(session: string | null, personality: AiPersonality, custom: string): ChatMsg[] {
  return [{ from: 'ai', text: greeting(session, personality, custom).text }];
}

export function VadoChat({
  variant,
  session,
  seedQuery,
  onSeedCreator,
  onNavigate,
}: {
  variant: 'sheet' | 'pane';
  session: string | null;
  seedQuery?: string;
  onSeedCreator?: (text: string) => void;
  onNavigate?: (target: string) => void;
}) {
  const toast = useToast();
  const [personality, setPersonality] = useState<AiPersonality>(() => load<AiPersonality>('personality', 'calm'));
  const [customText, setCustomText] = useState<string>(() => load<string>('personalityCustom', ''));
  const [showModes, setShowModes] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(() =>
    load<ChatMsg[]>('aiChat', initialHistory(session, load<AiPersonality>('personality', 'calm'), load<string>('personalityCustom', '')))
  );
  const [draft, setDraft] = useState('');
  const [typing, setTyping] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => save('aiChat', messages), [messages]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, typing]);
  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  const respond = useCallback((userText: string) => {
    setMessages((m) => [...m, { from: 'me', text: userText }]);
    setTyping(true);
    const id = window.setTimeout(() => {
      const reply = vadoReply(userText, personality, customText);
      setMessages((m) => [...m, { from: 'ai', text: reply.text, actions: reply.actions }]);
      setTyping(false);
    }, 900);
    timers.current.push(id);
  }, [personality, customText]);

  const sentSeed = useRef(false);
  useEffect(() => {
    if (seedQuery && !sentSeed.current) {
      sentSeed.current = true;
      respond(seedQuery);
    }
  }, [seedQuery, respond]);

  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.from === 'me');
    if (!lastUser) return;
    setMessages((m) => m.slice(0, m.length - 1));
    respond(lastUser.text);
  };

  const runAction = (action: AiQuickAction, text: string) => {
    if (action.kind === 'copy') {
      navigator.clipboard?.writeText(text).catch(() => undefined);
      toast('Copied to clipboard');
    } else if (action.kind === 'create') {
      const seed = text.split('\n').find((l) => l.trim().length > 0)?.replace(/[“”]/g, '').trim() ?? text;
      onSeedCreator?.(seed);
    } else if (action.kind === 'navigate') {
      onNavigate?.(action.target ?? 'vibes');
    } else if (action.kind === 'save') {
      const saved = load<string[]>('aiSaved', []);
      save('aiSaved', [text, ...saved].slice(0, 30));
      toast('Saved to your AI collection');
    }
  };

  const clearHistory = () => {
    setConfirmClear(true);
  };

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    respond(text);
  };

  return (
    <div className={`relative flex min-h-0 flex-1 flex-col ${variant === 'pane' ? 'h-full' : ''}`}>
      <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-1.5">
        <button
          type="button"
          onClick={() => setShowModes((v) => !v)}
          aria-expanded={showModes}
          aria-label="Choose VADO AI personality"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-beam/40 bg-volt/15 px-2.5 py-1 text-[11px] font-medium text-beam transition-colors hover:bg-volt/25"
        >
          <Wand2 size={12} />
          {personality === 'custom' ? 'Custom' : PERSONALITIES.find((p) => p.id === personality)?.label}
        </button>
        <span className="hidden min-w-0 flex-1 truncate text-center text-[11px] text-mist sm:inline">
          History stays on this device
        </span>
        <button
          type="button"
          onClick={clearHistory}
          aria-label="Clear AI history"
          className="flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] text-mist transition-colors hover:text-ink"
        >
          <Trash2 size={12} /> Clear
        </button>
      </div>

      <AnimatePresence>
        {showModes && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="shrink-0 overflow-hidden"
          >
            <div className="mx-3 mb-2 rounded-2xl border border-[#d8f3ff]/25 bg-glass p-3 backdrop-blur-lg">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Personality modes</p>
              <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Personality modes">
                {PERSONALITIES.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={personality === p.id}
                    onClick={() => {
                      setPersonality(p.id);
                      save('personality', p.id);
                      toast(`${p.label} mode on — applied everywhere`);
                    }}
                    className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                      personality === p.id ? 'border-beam bg-volt/25 text-white' : 'border-[#d8f3ff]/25 bg-white/5 text-mist hover:text-ink'
                    }`}
                    title={p.desc}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  role="radio"
                  aria-checked={personality === 'custom'}
                  onClick={() => {
                    setPersonality('custom');
                    save('personality', 'custom');
                  }}
                  className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                    personality === 'custom' ? 'border-beam bg-volt/25 text-white' : 'border-[#d8f3ff]/25 bg-white/5 text-mist hover:text-ink'
                  }`}
                >
                  Custom
                </button>
              </div>
              {personality === 'custom' && (
                <textarea
                  value={customText}
                  onChange={(e) => {
                    const v = e.target.value.slice(0, 160);
                    setCustomText(v);
                    save('personalityCustom', v);
                  }}
                  placeholder="Describe how VADO AI should sound — e.g. “like a patient film-studies tutor who loves bad puns”"
                  aria-label="Custom personality instructions"
                  rows={2}
                  className="mt-2.5 w-full resize-none rounded-xl border border-[#d8f3ff]/30 bg-deep px-3 py-2 text-[12px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
                />
              )}
              <p className="mt-2 text-[11px] leading-relaxed text-mist">{personalityLine(personality, customText)}</p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => respond('Give me a caption for tonight.')}
                  className="rounded-full border border-[#d8f3ff]/35 bg-volt/15 px-3.5 py-1.5 text-[11px] font-medium text-ink transition-colors hover:bg-volt/30"
                >
                  Hear a live sample
                </button>
                <button
                  type="button"
                  onClick={() => setShowModes(false)}
                  className="rounded-full border border-[#d8f3ff]/25 px-3.5 py-1.5 text-[11px] text-mist transition-colors hover:text-ink"
                >
                  Done
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="scroll-slim min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-2">
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] ${m.from === 'me' ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}>
                <span
                  className={`whitespace-pre-line rounded-2xl px-3.5 py-2 text-[13px] ${
                    m.from === 'me'
                      ? 'rounded-br-md bg-gradient-to-r from-volt to-beam text-white'
                      : 'rounded-bl-md border border-[#d8f3ff]/20 bg-glass text-ink backdrop-blur-lg'
                  }`}
                >
                  {m.text}
                </span>
                {m.from === 'ai' && i === messages.length - 1 && !typing && (
                  <span className="flex flex-wrap gap-1.5">
                    <MiniBtn label="Copy" onClick={() => copy(m.text, toast)}>
                      <Copy size={11} />
                    </MiniBtn>
                    <MiniBtn label="Save" onClick={() => runAction({ label: 'Save', kind: 'save' }, m.text)}>
                      <Bookmark size={11} />
                    </MiniBtn>
                    <MiniBtn label="Regenerate" onClick={regenerate}>
                      <RotateCcw size={11} />
                    </MiniBtn>
                    {(m.actions ?? []).map((a) => (
                      <MiniBtn key={a.label} label={a.label} onClick={() => runAction(a, m.text)} accent>
                        <Sparkles size={11} />
                      </MiniBtn>
                    ))}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {typing && (
          <div className="flex justify-start">
            <span className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-[#d8f3ff]/20 bg-glass px-3.5 py-2.5">
              {[0, 1, 2].map((d) => (
                <motion.span
                  key={d}
                  className="h-1.5 w-1.5 rounded-full bg-beam"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                />
              ))}
            </span>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="shrink-0 px-3 pb-1">
        <div className="scroll-slim flex gap-1.5 overflow-x-auto pb-1.5">
          {SUGGESTED_PROMPTS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => respond(p)}
              className="shrink-0 rounded-full border border-[#d8f3ff]/25 bg-glass px-3 py-1.5 text-[11px] text-mist backdrop-blur-lg transition-colors hover:border-beam/60 hover:text-ink"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={send} className="flex shrink-0 gap-2 px-3 pb-3 pt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask VADO AI…"
          aria-label="Message VADO AI"
          className="min-w-0 flex-1 rounded-full border border-[#d8f3ff]/30 bg-volt/10 px-4 py-2.5 text-sm text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
        />
        <button
          type="submit"
          aria-label="Send to VADO AI"
          disabled={!draft.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-volt to-beam text-white shadow-glow disabled:opacity-40"
        >
          <Sparkles size={16} />
        </button>
      </form>

      <AnimatePresence>
        {confirmClear && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              role="alertdialog"
              aria-modal="true"
              aria-label="Clear AI history"
              className="w-full max-w-xs rounded-3xl border border-[#d8f3ff]/35 bg-[#0a1f38]/95 p-5 shadow-glow-lg backdrop-blur-2xl"
            >
              <h3 className="text-[15px] font-semibold text-ink">Clear AI history?</h3>
              <p className="mt-1.5 text-[12px] text-mist">All saved replies on this device will be removed. This cannot be undone.</p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 rounded-full border border-[#d8f3ff]/25 bg-glass px-3 py-2 text-[12px] text-mist hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const fresh = initialHistory(session, personality, customText);
                    save('aiChat', fresh);
                    setMessages(fresh);
                    save('aiSaved', []);
                    setConfirmClear(false);
                    toast('AI history cleared');
                  }}
                  className="flex-1 rounded-full border border-red-400/60 bg-red-500/20 px-3 py-2 text-[12px] font-semibold text-red-200 hover:bg-red-500/30"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function copy(text: string, toast: (m: string) => void) {
  navigator.clipboard?.writeText(text).catch(() => undefined);
  toast('Copied to clipboard');
}

function MiniBtn({
  label,
  onClick,
  accent = false,
  children,
}: {
  label: string;
  onClick: () => void;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-medium transition-colors ${
        accent
          ? 'border-beam/50 bg-volt/20 text-beam hover:bg-volt/30'
          : 'border-[#d8f3ff]/25 bg-glass text-mist hover:text-ink'
      }`}
    >
      {children}
      {label}
    </button>
  );
}
