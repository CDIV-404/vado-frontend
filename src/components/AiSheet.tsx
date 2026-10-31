import { useEffect, useRef, useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mic, Send, Sparkles, X } from 'lucide-react';
import { AI_REPLIES, VOICE_TRANSCRIPT } from '../data/mock';

export type AiMode = 'closed' | 'chat' | 'voice';

export function AiSheet({
  mode,
  recording,
  onClose,
  onModeChange,
}: {
  mode: AiMode;
  recording: boolean;
  onClose: () => void;
  onModeChange: (m: AiMode) => void;
}) {
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState<{ from: 'me' | 'ai'; text: string }[]>([
    { from: 'ai', text: 'Hey — I’m VADO AI. Ask me for a vibe, a caption, or a remix.' },
  ]);
  const [draft, setDraft] = useState('');
  const [transcribing, setTranscribing] = useState(false);
  const replyIdx = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);
  const wasRecording = useRef(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (mode !== 'closed') window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, onClose]);

  const pushReply = (userText: string) => {
    setMessages((m) => [...m, { from: 'me', text: userText }]);
    window.setTimeout(() => {
      const reply = AI_REPLIES[replyIdx.current % AI_REPLIES.length];
      replyIdx.current += 1;
      setMessages((m) => [...m, { from: 'ai', text: reply }]);
    }, 800);
  };

  useEffect(() => {
    if (wasRecording.current && !recording && mode === 'voice') {
      setTranscribing(true);
      window.setTimeout(() => {
        setTranscribing(false);
        pushReply(VOICE_TRANSCRIPT);
        onModeChange('chat');
      }, 700);
    }
    wasRecording.current = recording;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  const send = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    pushReply(text);
  };

  if (mode === 'closed') return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label="VADO AI">
      <motion.button
        type="button"
        aria-label="Close VADO AI"
        onClick={onClose}
        className="absolute inset-0 bg-[#03101f]/60 backdrop-blur-[3px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      <motion.div
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => info.offset.y > 90 && onClose()}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative mx-2 mb-2 flex h-[70%] flex-col overflow-hidden rounded-3xl border border-[#d8f3ff]/35 bg-[#0a1f38]/90 shadow-glow-lg backdrop-blur-2xl"
        style={{
          backgroundImage: 'radial-gradient(at 50% 0%, rgba(22,135,255,0.28), transparent 60%)',
        }}
      >
        <header className="flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
          <span className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink">
            <Sparkles size={15} className="text-beam" /> VADO AI
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-mist transition-colors hover:bg-white/10 hover:text-ink"
          >
            <X size={16} />
          </button>
        </header>
        <div className="mx-auto h-1 w-10 shrink-0 rounded-full bg-[#d8f3ff]/30" aria-hidden="true" />

        {mode === 'voice' || recording || transcribing ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
            <motion.span
              aria-hidden="true"
              className="relative flex h-20 w-20 items-center justify-center rounded-full border border-beam/70 bg-volt/20 text-beam"
              animate={recording && !reduce ? { scale: [1, 1.12, 1] } : undefined}
              transition={{ duration: 1.1, repeat: recording ? Infinity : 0 }}
            >
              {recording && !reduce && (
                <motion.span
                  className="absolute inset-0 rounded-full border-2 border-beam/50"
                  animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity }}
                />
              )}
              <Mic size={28} />
            </motion.span>
            <p className="text-[15px] font-medium text-ink">
              {transcribing ? 'Transcribing…' : recording ? 'Listening…' : 'Hold the VADO button to talk'}
            </p>
            {recording && (
              <div className="flex items-end gap-1" aria-hidden="true">
                {[10, 18, 26, 16, 30, 20, 12].map((h, i) => (
                  <motion.span
                    key={i}
                    className="w-1.5 rounded-full bg-beam"
                    animate={{ height: [h, h * 0.35, h] }}
                    transition={{ duration: 0.8 + i * 0.12, repeat: Infinity, delay: i * 0.06 }}
                  />
                ))}
              </div>
            )}
            {transcribing && <span className="h-6 w-6 animate-spin rounded-full border-2 border-beam/25 border-t-beam" />}
          </div>
        ) : (
          <>
            <div className="scroll-slim min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                  <span
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] ${
                      m.from === 'me'
                        ? 'rounded-br-md bg-gradient-to-r from-volt to-beam text-white'
                        : 'rounded-bl-md border border-[#d8f3ff]/20 bg-glass text-ink backdrop-blur-lg'
                    }`}
                  >
                    {m.text}
                  </span>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <form onSubmit={send} className="flex shrink-0 gap-2 px-3 pb-4 pt-1">
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
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-volt to-beam text-white shadow-glow"
              >
                <Send size={16} />
              </button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
