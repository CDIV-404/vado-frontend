import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Orbit, SlidersHorizontal, MessageCircle, Eye } from 'lucide-react';
import { VadoEmblem } from './VadoEmblem';
import type { Tab } from '../App';

const ITEMS: { tab: Tab; label: string; icon: typeof Orbit }[] = [
  { tab: 'vibes', label: 'Vibes', icon: Orbit },
  { tab: 'studio', label: 'Studio', icon: SlidersHorizontal },
  { tab: 'chat', label: 'Chat', icon: MessageCircle },
  { tab: 'views', label: 'Views', icon: Eye },
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
      onAiTap();
    }
  };

  return (
    <nav
      aria-label="Primary"
      className="pb-safe relative z-20 shrink-0 border-t border-[#d8f3ff]/20 bg-[#07192b]/85 shadow-[0_-8px_30px_rgba(22,135,255,0.15)] backdrop-blur-xl"
    >
      <ul className="mx-auto flex max-w-md items-end justify-around px-2 pt-1.5">
        {ITEMS.slice(0, 2).map((item) => (
          <NavItem key={item.tab} item={item} active={active === item.tab} onSelect={onSelect} />
        ))}
        <li>
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
                onAiTap();
              }
            }}
            whileTap={reduce ? undefined : { scale: 0.92 }}
            className="relative -mt-7 flex h-14 w-14 items-center justify-center rounded-full border border-[#d8f3ff]/70 bg-[#0b2540] shadow-glow-lg"
          >
            {!reduce && (
              <motion.span
                aria-hidden="true"
                className="absolute inset-[-5px] rounded-full border-2 border-beam/60"
                animate={{ scale: [1, 1.18, 1], opacity: [0.7, 0.15, 0.7] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
            <VadoEmblem size={34} />
          </motion.button>
        </li>
        {ITEMS.slice(2).map((item) => (
          <NavItem key={item.tab} item={item} active={active === item.tab} onSelect={onSelect} />
        ))}
      </ul>
    </nav>
  );
}

function NavItem({
  item,
  active,
  onSelect,
}: {
  item: { tab: Tab; label: string; icon: typeof Orbit };
  active: boolean;
  onSelect: (tab: Tab) => void;
}) {
  const Icon = item.icon;
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect(item.tab)}
        aria-current={active ? 'page' : undefined}
        className={`flex w-14 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition-colors duration-150 ${
          active ? 'text-beam [text-shadow:0_0_10px_rgba(56,201,255,0.8)]' : 'text-mist hover:text-ink'
        }`}
      >
        <Icon size={21} strokeWidth={active ? 2.4 : 2} />
        {item.label}
        <span
          className={`h-1 w-1 rounded-full transition-opacity ${active ? 'bg-beam opacity-100 shadow-glow' : 'opacity-0'}`}
        />
      </button>
    </li>
  );
}
