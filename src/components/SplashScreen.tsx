import { useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { VadoEmblem } from './VadoEmblem';

export function SplashScreen({ onDone }: { onDone: () => void }) {
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(onDone, reduce ? 600 : 2200);
    return () => clearTimeout(t);
  }, [onDone, reduce]);

  return (
    <motion.div
      className="vado-splash relative flex h-full flex-col items-center justify-center gap-5 overflow-hidden bg-night px-6"
      style={{
        background:
          'radial-gradient(ellipse at 50% 44%, rgba(22,135,255,0.2), transparent 58%), radial-gradient(ellipse at 50% 90%, rgba(120,90,255,0.1), transparent 46%), #030b16',
      }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {!reduce && (
        <motion.span
          aria-hidden="true"
          className="absolute h-56 w-56 rounded-full bg-volt/25 blur-3xl"
          animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.7, 0.35] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <motion.div
        className="relative"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {!reduce && (
          <motion.span
            aria-hidden="true"
            className="absolute inset-[-18px] rounded-full border border-beam/60"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: [0, 0.9, 0, 0.7, 0], scale: [0.85, 1.15, 1.3, 1.15, 1.35] }}
            transition={{ duration: 2.4, times: [0, 0.25, 0.5, 0.7, 1], ease: 'easeOut' }}
          />
        )}
        <VadoEmblem size={132} drawStrokes />
      </motion.div>
      <motion.p
        className="text-[11px] font-semibold uppercase tracking-[0.5em] text-ink/90"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0 : 1.1, duration: 0.5 }}
      >
        VADO
      </motion.p>
      <motion.p
        className="text-[13px] text-mist"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: reduce ? 0.1 : 1.4, duration: 0.5 }}
      >
        Opening your world of Vibes…
      </motion.p>
    </motion.div>
  );
}
