import { motion, useReducedMotion } from 'framer-motion';

const STROKES = [-36, -18, 0, 18, 36];

export function VadoEmblem({
  size = 150,
  drawStrokes = false,
  breathe = false,
}: {
  size?: number;
  drawStrokes?: boolean;
  breathe?: boolean;
}) {
  const reduce = useReducedMotion();
  const animate = (v: boolean) => v && !reduce;

  return (
    <div className="relative inline-flex items-center justify-center">
      {animate(breathe) && (
        <motion.span
          aria-hidden="true"
          className="absolute h-[70%] w-[70%] rounded-full bg-volt/40 blur-2xl"
          animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      <svg
        viewBox="0 0 196 220"
        width={size}
        height={(size * 220) / 196}
        role="img"
        aria-label="VADO emblem"
        className="relative drop-shadow-[0_0_8px_rgba(55,206,255,0.9)] drop-shadow-[0_0_26px_rgba(0,149,255,0.55)]"
      >
        <defs>
          <linearGradient id="vado-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8ce8ff" />
            <stop offset="100%" stopColor="#1d7fe0" />
          </linearGradient>
          <linearGradient id="vado-streak" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(200,240,255,0)" />
            <stop offset="50%" stopColor="rgba(225,247,255,0.95)" />
            <stop offset="100%" stopColor="rgba(200,240,255,0)" />
          </linearGradient>
        </defs>
        <ellipse
          cx="98"
          cy="112"
          rx="70"
          ry="44"
          fill="none"
          stroke="url(#vado-ring)"
          strokeWidth="13"
          transform="rotate(-9 98 112)"
        />
        {STROKES.map((dx, i) => (
          <motion.path
            key={dx}
            d={`M ${98 + dx} 14 C ${98 + dx - 3} 70 ${98 + dx - 3} 154 ${98 + dx} 208 C ${98 + dx + 3} 154 ${98 + dx + 3} 70 ${98 + dx} 14 Z`}
            fill="url(#vado-streak)"
            opacity={i === 2 ? 0.95 : 0.65}
            initial={animate(drawStrokes) ? { pathLength: 0, opacity: 0 } : false}
            animate={animate(drawStrokes) ? { pathLength: 1, opacity: i === 2 ? 0.95 : 0.65 } : undefined}
            transition={
              animate(drawStrokes)
                ? { pathLength: { delay: 0.25 + i * 0.12, duration: 0.55, ease: 'easeOut' }, opacity: { delay: 0.25 + i * 0.12, duration: 0.3 } }
                : undefined
            }
          />
        ))}
        <text
          x="101"
          y="121"
          textAnchor="middle"
          fill="#eaf6ff"
          fontSize="21"
          fontWeight="600"
          letterSpacing="9"
          style={{ textShadow: '0 0 10px rgba(80,170,255,0.9)' }}
        >
          VADO
        </text>
      </svg>
    </div>
  );
}
