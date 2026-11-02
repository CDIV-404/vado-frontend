import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

export function LineChart({
  points,
  height = 140,
  label,
}: {
  points: number[];
  height?: number;
  label: string;
}) {
  const reduce = useReducedMotion();
  const gid = useId().replace(/:/g, '');
  const w = 320;
  const h = height;
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = w / (points.length - 1 || 1);
  const coords = points.map((p, i) => [i * step, h - 8 - ((p - min) / span) * (h - 20)] as const);
  const d = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${d} L${w},${h} L0,${h} Z`;
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={label}
      className="w-full"
      preserveAspectRatio="none"
      style={{ height }}
    >
      <defs>
        <linearGradient id={`stroke-${gid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1687ff" />
          <stop offset="100%" stopColor="#38c9ff" />
        </linearGradient>
        <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38c9ff" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#38c9ff" stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${gid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={area} fill={`url(#fill-${gid})`} />
      <motion.path
        d={d}
        fill="none"
        stroke={`url(#stroke-${gid})`}
        strokeWidth="2.5"
        strokeLinecap="round"
        filter={`url(#glow-${gid})`}
        initial={reduce ? undefined : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.1, ease: 'easeOut' }}
      />
    </svg>
  );
}

export function BarChart({
  data,
  label,
}: {
  data: { label: string; value: number }[];
  label: string;
}) {
  const reduce = useReducedMotion();
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div role="img" aria-label={label} className="flex h-36 items-stretch gap-2">
      {data.map((d, i) => (
        <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <motion.div
            className="w-full flex-1 origin-bottom rounded-t-lg bg-gradient-to-t from-volt/70 to-beam shadow-glow-in"
            initial={reduce ? undefined : { scaleY: 0 }}
            animate={{ scaleY: Math.max(0.04, d.value / max) }}
            transition={{ delay: reduce ? 0 : i * 0.05, duration: 0.5, ease: 'easeOut' }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="w-full truncate text-center text-[9px] text-mist">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({ points, width = 88, height = 24 }: { points: number[]; width?: number; height?: number }) {
  const max = Math.max(...points, 1);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = width / (points.length - 1 || 1);
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * step).toFixed(1)},${(height - 2 - ((p - min) / span) * (height - 4)).toFixed(1)}`)
    .join(' ');
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke="#38c9ff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
    </svg>
  );
}

export function ProgressRing({
  pct,
  size = 64,
  label,
}: {
  pct: number;
  size?: number;
  label: string;
}) {
  const reduce = useReducedMotion();
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} role="img" aria-label={label} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(216,243,255,0.15)" strokeWidth="5" />
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#38c9ff"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={reduce ? undefined : { strokeDashoffset: c }}
        animate={{ strokeDashoffset: c - (Math.min(100, pct) / 100) * c }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: 'drop-shadow(0 0 6px rgba(56,201,255,0.6))' }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#f1f5fc"
        fontSize={size / 4.6}
        fontWeight={600}
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
}
