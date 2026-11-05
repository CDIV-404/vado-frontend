"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";
import { api, post, readLocal, writeLocal } from "@/lib/client";
import type { MeUser } from "@/lib/types";

type ToastKind = "success" | "info" | "warn" | "error";
type Toast = { id: number; msg: string; kind: ToastKind };

type Ctx = {
  user: MeUser | null;
  ready: boolean;
  unread: number;
  setUnread: (n: number) => void;
  setUser: (u: MeUser | null) => void;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  promptAuth: (msg?: string) => void;
  toast: (msg: string, kind?: ToastKind) => void;
  muted: boolean;
  setMuted: (m: boolean) => void;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp(): Ctx {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp outside provider");
  return ctx;
}

const TOAST_ICON: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 size={17} className="text-vado-success shrink-0" />,
  info: <Info size={17} className="text-vado-cyan shrink-0" />,
  warn: <AlertTriangle size={17} className="text-vado-warn shrink-0" />,
  error: <XCircle size={17} className="text-vado-danger shrink-0" />,
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [ready, setReady] = useState(false);
  const [unread, setUnread] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [muted, setMutedState] = useState(true);
  const router = useRouter();
  const idRef = useRef(0);
  const prevUnread = useRef(0);
  const userRef = useRef<MeUser | null>(null);
  userRef.current = user;

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ user: MeUser | null; unread: number }>("/api/auth/me");
      setUser(data.user);
      if (data.unread > prevUnread.current && userRef.current?.desktopNotifications && typeof Notification !== "undefined" && Notification.permission === "granted") {
        try {
          new Notification("VADO", { body: `You have ${data.unread} unread notification${data.unread === 1 ? "" : "s"}` });
        } catch { /* not supported */ }
      }
      prevUnread.current = data.unread;
      setUnread(data.unread);
    } catch {
      /* offline */
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    setMutedState(readLocal("vado_muted", true));
    void refresh();
    const t = setInterval(() => void refresh(), 25_000);
    return () => clearInterval(t);
  }, [refresh]);

  const setMuted = useCallback((m: boolean) => {
    setMutedState(m);
    writeLocal("vado_muted", m);
  }, []);

  const toast = useCallback((msg: string, kind: ToastKind = "info") => {
    const id = ++idRef.current;
    setToasts((t) => [...t.slice(-3), { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3400);
  }, []);

  const promptAuth = useCallback(
    (msg?: string) => {
      toast(msg ?? "Sign in to continue", "info");
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      router.push(`/auth?next=${next}`);
    },
    [router, toast]
  );

  const logout = useCallback(async () => {
    try {
      await post("/api/auth/logout");
    } catch { /* ignore */ }
    setUser(null);
    setUnread(0);
    toast("Signed out. See you soon 👋", "success");
    router.push("/");
  }, [router, toast]);

  return (
    <AppCtx.Provider value={{ user, ready, unread, setUnread, setUser, refresh, logout, promptAuth, toast, muted, setMuted }}>
      {children}
      <div className="fixed bottom-24 lg:bottom-8 left-1/2 -translate-x-1/2 z-[120] flex flex-col items-center gap-2 px-4 w-full max-w-md pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="glass-deep rounded-2xl px-4 py-3 flex items-center gap-2.5 text-sm font-medium text-vado-text shadow-2xl pointer-events-auto"
            >
              {TOAST_ICON[t.kind]}
              <span>{t.msg}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AppCtx.Provider>
  );
}