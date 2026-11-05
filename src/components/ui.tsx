"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";
import { avatarGradient } from "@/lib/format";

/* ── Brand ──────────────────────────────────────────────── */

export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="vado-lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#38C9FF" />
          <stop offset="0.5" stopColor="#287CFF" />
          <stop offset="1" stopColor="#8057FF" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="17" fill="url(#vado-lg)" />
      <rect width="64" height="64" rx="17" fill="white" opacity="0.08" />
      <path d="M19 17l13 30 13-30h-8.4L32 30.5 27.4 17z" fill="white" />
    </svg>
  );
}

export function Logo({ size = 30, word = true }: { size?: number; word?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 select-none">
      <LogoMark size={size} />
      {word && <span className="font-extrabold tracking-[0.22em] text-vado-text text-lg">VADO</span>}
    </span>
  );
}

/* ── Avatar ─────────────────────────────────────────────── */

export function Avatar({
  src,
  name,
  size = 44,
  ring = false,
  className = "",
}: {
  src: string | null | undefined;
  name: string;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const inner = src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      className="rounded-full object-cover"
      style={{ width: size, height: size }}
      loading="lazy"
    />
  ) : (
    <span
      className="rounded-full flex items-center justify-center font-bold text-white"
      style={{ width: size, height: size, background: avatarGradient(name), fontSize: size * 0.4 }}
    >
      {(name || "?").replace(/^@/, "").charAt(0).toUpperCase()}
    </span>
  );
  if (!ring) return <span className={`inline-block shrink-0 ${className}`}>{inner}</span>;
  return (
    <span className={`inline-block shrink-0 rounded-full ring-grad p-[2.5px] ${className}`}>
      <span className="block rounded-full p-[2px] bg-vado-bg">{inner}</span>
    </span>
  );
}

/* ── Spinner / empty ────────────────────────────────────── */

export function Spinner({ size = 28 }: { size?: number }) {
  return (
    <span
      className="inline-block rounded-full border-2 border-white/15 border-t-vado-cyan animate-spin"
      style={{ width: size, height: size }}
      aria-label="Loading"
    />
  );
}

export function EmptyState({
  icon: Icon,
  title,
  sub,
  action,
}: {
  icon: LucideIcon;
  title: string;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl px-8 py-12 flex flex-col items-center text-center gap-3 max-w-md mx-auto"
    >
      <span className="w-16 h-16 rounded-2xl glass-soft flex items-center justify-center">
        <Icon size={28} className="text-vado-cyan" />
      </span>
      <h3 className="font-bold text-lg text-vado-text">{title}</h3>
      {sub && <p className="text-sm text-vado-sub leading-relaxed max-w-xs">{sub}</p>}
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
  );
}

/* ── Modal ──────────────────────────────────────────────── */

export function Modal({
  open,
  onClose,
  children,
  title,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  wide?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-[#05070f]/70 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 32, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className={`relative glass-deep rounded-t-3xl sm:rounded-3xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[88dvh] overflow-y-auto`}
          >
            {title !== undefined && (
              <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b border-white/10 bg-white/[0.03] backdrop-blur-xl rounded-t-3xl">
                <h3 className="font-bold text-vado-text">{title}</h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full glass-soft flex items-center justify-center hover:bg-white/10 transition" aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            )}
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ── Toggle ─────────────────────────────────────────────── */

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6.5 rounded-full transition-colors duration-200 shrink-0 ${on ? "bg-gradient-to-r from-vado-blue to-vado-purple" : "bg-white/12"}`}
      style={{ height: 26 }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-[3px] w-5 h-5 rounded-full bg-white shadow-md"
        style={{ left: on ? 22 : 3 }}
      />
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-vado-sub mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-vado-sub/70 mt-1">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "glass-input w-full rounded-xl px-3.5 py-2.5 text-sm text-vado-text placeholder:text-vado-sub/50";
