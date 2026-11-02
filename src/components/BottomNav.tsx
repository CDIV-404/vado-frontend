import { useRef, useState, type ComponentType } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Eye, MessageCircle, Orbit } from 'lucide-react';
import { VadoEmblem } from './VadoEmblem';
import type { Tab } from '../App';

type IconProps = { size?: string | number; strokeWidth?: string | number };

function EqualizerIcon({ size = 20, strokeWidth = 1.7 }: IconProps) {
  return (
    <svg
      width={Number(size)}
      height={Number(size)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={Number(strokeWidth)}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <line x1="6" y1="4" x2="6" y2="20" />
      <line x1="12" y1="9" x2="12" y2="20" />
      <line x1="18" y1="6" x2="18" y2="20" />
    </svg>
  );
}

const LEFT_ITEMS: { tab: Tab; label: string; Icon: ComponentType<IconProps> }[] = [
  { tab: 'vibes', label: 'Vibes', Icon: Orbit },
  { tab: 'studio', label: 'Studio', Icon: EqualizerIcon },
];
const RIGHT_ITEMS: { tab: Tab; label: string; Icon: ComponentType<IconProps> }[] = [
  { tab: 'chat', label: 'Chat', Icon: MessageCircle },
  { tab: 'views', label: 'Views', Icon: Eye },
];

export function BottomNav({
  active,
  onSelect,
  onAiTap,
  onAiHoldStart,
  onAiHoldEnd,
  aiOpen,
}: {
  active: Tab;
  onSelect: (tab: Tab) => void;
  onAiTap: () => void;
  onAiHoldStart: () => void;
  onAiHoldEnd: () => void;
  aiOpen: boolean;
}) {
  const reduce = useReducedMotion();
  const holdTimer = useRef<number | null>(null);
  const held = useRef(false);
  const [pulseKey, setPulseKey] = useState(0);

  const firePulse = () => setPulseKey((k) => k + 1);

  const startHold = () => {
    held.current = false;
    holdTimer.current = window.setTimeout(() => {
      held.current = true;
      onAiHoldStart();
    }, 450);
  };
  const endHold = () => {
    if (holdTimer.current) window.clearTimeout(holdTimer.current);
    if (held.current) {
      held.current = false;
      onAiHoldEnd();
    } else {
      firePulse();
      onAiTap();
    }
  };

  return (
    <nav
      aria-label="Primary"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-[4%] pb-[max(12px,calc(env(safe-area-inset-bottom,0px)+8px))]"
    >
      <div className="pointer-events-auto relative mx-auto flex h-16 w-full max-w-[380px] items-stretch rounded-[22px] border border-volt/70 bg-[#081a30]/70 shadow-[0_0_22px_rgba(56,201,255,0.28)] backdrop-blur-xl transition-[border-color,box-shadow] duration-300 hover:border-beam/90 hover:shadow-[0_0_30px_rgba(56,201,255,0.45)] focus-within:border-beam/90">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
        />

        <ul className="flex w-full list-none items-stretch py-0.5">
          {LEFT_ITEMS.map((item) => (
            <NavItem key={item.tab} item={item} active={active === item.tab} onSelect={onSelect} reduce={!!reduce} />
          ))}

          <li className="relative w-[26%]">
            <motion.button
              type="button"
              aria-label="VADO AI — tap for chat, hold to start voice"
              aria-pressed={aiOpen}
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={() => holdTimer.current && window.clearTimeout(holdTimer.current)}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
              }}
              onKeyUp={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  firePulse();
                  onAiTap();
                }
              }}
              whileHover={reduce ? undefined : { scale: 1.06 }}
              whileTap={reduce ? undefined : { scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 26 }}
              className={`absolute -top-7 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-2 border-beam/90 bg-gradient-to-b from-[#123a66] to-[#0a2340] shadow-[0_0_18px_rgba(56,201,255,0.5),inset_0_0_10px_rgba(124,92,255,0.55),inset_0_0_20px_rgba(22,135,255,0.45)] ${
                aiOpen ? 'border-[#8ce8ff]' : ''
              }`}
            >
              {!reduce && (
                <motion.span
                  aria-hidden="true"
                  className="absolute -inset-1.5 rounded-full bg-volt/25 blur-md"
                  animate={{ scale: [1, 1.22, 1], opacity: [0.55, 0.25, 0.55] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              {pulseKey > 0 && !reduce && (
                <motion.span
                  key={pulseKey}
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background: 'radial-gradient(circle, rgba(96,190,255,0.6) 0%, rgba(96,190,255,0) 70%)',
                  }}
                  initial={{ scale: 0.8, opacity: 0.9 }}
                  animate={{ scale: 2.2, opacity: 0 }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  onAnimationComplete={() => setPulseKey(0)}
                />
              )}
              <VadoEmblem size={30} />
            </motion.button>
            <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-[9px] font-medium uppercase tracking-[0.18em] text-sky">
              VADO
            </span>
          </li>

          {RIGHT_ITEMS.map((item) => (
            <NavItem key={item.tab} item={item} active={active === item.tab} onSelect={onSelect} reduce={!!reduce} />
          ))}
        </ul>
      </div>
    </nav>
  );
}

function NavItem({
  item,
  active,
  onSelect,
  reduce,
}: {
  item: { tab: Tab; label: string; Icon: ComponentType<IconProps> };
  active: boolean;
  onSelect: (tab: Tab) => void;
  reduce: boolean;
}) {
  const { Icon } = item;
  return (
    <li className="flex flex-1">
      <motion.button
        type="button"
        onClick={() => onSelect(item.tab)}
        aria-current={active ? 'page' : undefined}
        whileHover={reduce ? undefined : { scale: 1.07 }}
        whileTap={reduce ? undefined : { scale: 0.93 }}
        transition={{ type: 'spring', stiffness: 400, damping: 26 }}
        className={`flex h-full w-full flex-col items-center justify-center gap-1 rounded-2xl text-[10px] font-medium tracking-wide transition-colors duration-150 ${
          active ? 'text-beam [text-shadow:0_0_10px_rgba(56,201,255,0.8)]' : 'text-mist hover:text-ink'
        }`}
      >
        <Icon size={20} strokeWidth={active ? 2 : 1.6} />
        {item.label}
        <span
          className={`h-1 w-1 rounded-full transition-opacity ${
            active ? 'bg-beam opacity-100 shadow-glow' : 'opacity-0'
          }`}
        />
      </motion.button>
    </li>
  );
}
