import { ReactNode, useEffect } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';

export function Chip({
  active,
  onClick,
  children,
  className = '',
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors ${
        active
          ? 'border-beam bg-volt/25 text-white shadow-glow-in'
          : 'border-[#d8f3ff]/25 bg-glass text-mist hover:border-beam/60 hover:text-ink'
      } ${className}`}
    >
      {children}
    </button>
  );
}

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return;
    const fn = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [active, onClose]);
}

export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-40 flex flex-col justify-end md:justify-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative mx-2 mb-2 flex max-h-[75%] flex-col overflow-hidden rounded-3xl border border-[#d8f3ff]/35 bg-[#0a1f38]/95 shadow-glow-lg backdrop-blur-2xl md:mx-auto md:mb-0 md:w-full md:max-w-[560px] md:max-h-[70vh]"
          >
            <span className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" aria-hidden="true" />
            <div className="flex items-center justify-between border-b border-[#d8f3ff]/15 px-4 py-3">
              <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d8f3ff]/20 bg-glass text-mist transition-colors hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>
            <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel = 'Confirm',
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  useEscape(open, onClose);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[55] flex items-center justify-center p-4"
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.94, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="relative w-full max-w-sm rounded-3xl border border-[#d8f3ff]/35 bg-[#0a1f38]/95 p-5 shadow-glow-lg backdrop-blur-2xl"
          >
            <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-mist">{body}</p>
            <div className="mt-5 flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-full border border-[#d8f3ff]/25 bg-glass px-4 py-2.5 text-[13px] font-medium text-mist transition-colors hover:text-ink"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 rounded-full px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                  danger
                    ? 'border border-red-400/60 bg-red-500/20 text-red-200 hover:bg-red-500/30'
                    : 'border border-[#d8f3ff] bg-volt/25 text-white shadow-glow-in hover:bg-volt/40'
                }`}
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-col items-center py-14 text-center">
      <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-beam/30 bg-volt/10 text-beam shadow-glow">
        {icon}
      </span>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-mist">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl border border-[#d8f3ff]/15 bg-glass/60 ${className}`}
    />
  );
}

export function SectionCard({
  title,
  children,
  className = '',
}: {
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-[#d8f3ff]/25 bg-glass p-4 backdrop-blur-lg ${className}`}
    >
      {title && (
        <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">{title}</h3>
      )}
      {children}
    </section>
  );
}

export function ScreenOverlay({
  title,
  onClose,
  actions,
  children,
}: {
  title: string;
  onClose: () => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const reduce = useReducedMotion();
  useEscape(true, onClose);
  return (
    <motion.div
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 z-40 flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative mt-2 flex h-[calc(100%-8px)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-[#d8f3ff]/35 bg-[#0a1f38]/95 shadow-glow-lg backdrop-blur-2xl">
        <header className="flex shrink-0 items-center gap-2 border-b border-[#d8f3ff]/15 px-3 py-2.5">
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8f3ff]/25 bg-glass text-mist transition-colors hover:text-ink"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{title}</h2>
          {actions}
        </header>
        <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </motion.div>
  );
}
