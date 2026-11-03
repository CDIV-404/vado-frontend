import { Eye, MessageCircle, Orbit } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { VadoEmblem } from './VadoEmblem';

export type Tab = 'home' | 'discover' | 'create' | 'inbox' | 'profile' | 'views';

const ITEMS: { tab: Tab; label: string; Icon?: typeof Orbit }[] = [
  { tab: 'home', label: 'Vibes', Icon: Orbit },
  { tab: 'create', label: 'Studio' },
  { tab: 'home', label: 'VADO' },
  { tab: 'inbox', label: 'Chat', Icon: MessageCircle },
  { tab: 'views', label: 'Views', Icon: Eye },
];

export function BottomNav({ active, onSelect }: { active: Tab; onSelect: (tab: Tab) => void }) {
  const reduce = useReducedMotion();

  return (
    <nav aria-label="Primary" className="vado-dock">
      <span aria-hidden="true" className="vado-dock-highlight" />
      <ul className="relative flex h-full items-center justify-between">
        {ITEMS.map((item, index) => {
          const { tab, label } = item;
          const center = index === 2;
          const selected = !center && active === tab;
          const Icon = index === 1 ? EqualizerIcon : item.Icon;
          return (
            <li key={`${label}-${index}`} className={`flex h-full flex-1 items-center justify-center ${center ? 'relative' : ''}`}>
              <button
                type="button"
                onClick={() => onSelect(center ? 'home' : tab)}
                aria-current={selected ? 'page' : undefined}
                aria-label={center ? 'VADO home' : label}
                className={`dock-item ${center ? 'dock-center' : ''} ${selected ? 'is-active' : ''}`}
              >
                {center ? (
                  <>
                    <motion.span
                      className="dock-center-orb"
                      whileHover={reduce ? undefined : { scale: 1.04 }}
                      whileTap={reduce ? undefined : { scale: 0.94 }}
                    >
                      <span className="dock-center-glow" aria-hidden="true" />
                      <VadoEmblem size={36} />
                    </motion.span>
                    <span className="dock-center-label">VADO</span>
                  </>
                ) : (
                  <>
                    {Icon && <Icon size={19} strokeWidth={selected ? 2 : 1.6} />}
                    <span>{label}</span>
                    {selected && <motion.i className="dock-active-dot" layoutId="dock-active-dot" />}
                  </>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function EqualizerIcon({ size = 19, strokeWidth = 1.6 }: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" aria-hidden="true">
      <path d="M5 4v16M12 9v11M19 6v14" />
    </svg>
  );
}
