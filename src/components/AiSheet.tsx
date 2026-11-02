import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mic, Sparkles, X } from 'lucide-react';
import { VOICE_TRANSCRIPT } from '../data/mock';
import { VadoChat } from './VadoChat';

export type AiMode = 'closed' | 'chat' | 'voice';

export function AiSheet({
  mode,
  recording,
  session,
  onClose,
  onModeChange,
  onSeedCreator,
  onNavigate,
}: {
  mode: AiMode;
  recording: boolean;
  session: string | null;
  onClose: () => void;
  onModeChange: (m: AiMode) => void;
  onSeedCreator?: (text: string) => void;
  onNavigate?: (target: string) => void;
}) {
  const reduce = useReducedMotion();
  const [transcribing, setTranscribing] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const wasRecording = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (mode !== 'closed') window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mode, onClose]);

  useEffect(() => {
    if (wasRecording.current && !recording && mode === 'voice') {
      setTranscribing(true);
      const t = window.setTimeout(() => {
        setTranscribing(false);
        setPendingQuery(VOICE_TRANSCRIPT.replace(/[“”]/g, ''));
        onModeChange('chat');
      }, 700);
      return () => window.clearTimeout(t);
    }
    wasRecording.current = recording;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording]);

  useEffect(() => {
    if (mode === 'closed') setPendingQuery(null);
  }, [mode]);

  if (mode === 'closed') return null;

  const voiceOnly = mode === 'voice' || recording || transcribing;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end md:justify-center" role="dialog" aria-modal="true" aria-label="VADO AI">
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
        drag={voiceOnly ? false : 'y'}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragEnd={(_, info) => info.offset.y > 90 && onClose()}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
        className="relative mx-2 mb-2 flex h-[70%] max-h-[560px] flex-col overflow-hidden rounded-3xl border border-[#d8f3ff]/35 bg-[#0a1f38]/90 shadow-glow-lg backdrop-blur-2xl md:mx-auto md:mb-0 md:h-[min(560px,80vh)] md:w-full md:max-w-[560px]"
        style={{
          backgroundImage: 'radial-gradient(at 50% 0%, rgba(22,135,255,0.28), transparent 60%)',
        }}
      >
        <span className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" aria-hidden="true" />
        <header className="flex shrink-0 items-center justify-between px-4 pb-1 pt-3">
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

        {voiceOnly ? (
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
            <p className="max-w-[260px] text-[12px] text-mist">{transcribing ? VOICE_TRANSCRIPT : ''}</p>
          </div>
        ) : (
          <VadoChat variant="sheet" session={session} seedQuery={pendingQuery ?? undefined} onSeedCreator={onSeedCreator} onNavigate={onNavigate} />
        )}
      </motion.div>
    </div>
  );
}
