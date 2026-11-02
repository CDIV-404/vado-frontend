import { motion, useReducedMotion } from 'framer-motion';
import { VadoEmblem } from './VadoEmblem';

export function WelcomeScreen({ onStart }: { onStart: () => void }) {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: reduce ? 0 : delay, duration: 0.45, ease: 'easeOut' as const },
  });

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 overflow-y-auto px-8 py-10 text-center">
      <motion.div {...rise(0.05)} className="mb-4">
        <motion.div
          animate={reduce ? undefined : { y: [0, -7, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <VadoEmblem size={128} breathe />
        </motion.div>
      </motion.div>
      <motion.h1 {...rise(0.2)} className="text-[34px] font-semibold leading-[1.1] text-ink">
        Welcome to
        <br />
        VADO
      </motion.h1>
      <motion.p {...rise(0.32)} className="text-[15px] text-mist">
        Your vibe starts here
      </motion.p>
      <motion.button
        {...rise(0.45)}
        whileTap={reduce ? undefined : { scale: 0.96 }}
        onClick={onStart}
        className="mt-10 w-full max-w-xs rounded-full border border-[#d8f3ff] bg-volt/15 px-8 py-3.5 text-[17px] font-medium text-white shadow-glow shadow-glow-in transition-all duration-150 hover:bg-volt/30 hover:shadow-glow-lg sm:min-w-[280px]"
      >
        Get Started
      </motion.button>
    </div>
  );
}
