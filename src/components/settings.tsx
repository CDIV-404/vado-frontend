"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, Bell, Eye, Monitor, LogOut, Trash2, BadgeCheck, AlertCircle, Smartphone } from "lucide-react";
import { useApp } from "@/components/providers";
import { Avatar, Spinner, EmptyState, Toggle } from "@/components/ui";
import { api } from "@/lib/client";
import { timeAgo } from "@/lib/format";

type Session = { id: string; userAgent: string; createdAt: string; expiresAt: string; current: boolean };

function deviceOf(ua: string): string {
  if (/iphone|android.*mobile|mobile/i.test(ua)) return "Mobile";
  if (/ipad|tablet/i.test(ua)) return "Tablet";
  if (/mac/i.test(ua)) return "Mac";
  if (/windows/i.test(ua)) return "Windows PC";
  if (/linux/i.test(ua)) return "Linux";
  return "Browser";
}

export function SettingsView() {
  const { user, ready, setUser, refresh, logout, toast, promptAuth } = useApp();
  const [sessions, setSessions] = useState<Session[] | null>(null);

  const loadSessions = useCallback(() => {
    api<{ sessions: Session[] }>("/api/sessions").then((d) => setSessions(d.sessions)).catch(() => setSessions([]));
  }, []);

  useEffect(() => {
    if (user) loadSessions();
  }, [user, loadSessions]);

  const patchMe = async (body: Record<string, unknown>) => {
    try {
      const r = await api<{ user: NonNullable<typeof user> }>("/api/users/me", { method: "PATCH", body: JSON.stringify(body) });
      setUser(r.user);
      toast("Settings saved", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't save", "error");
    }
  };

  const toggleDesktop = async (on: boolean) => {
    if (on && typeof Notification !== "undefined") {
      if (Notification.permission === "denied") {
        toast("Notifications are blocked in your browser settings", "warn");
        return;
      }
      if (Notification.permission !== "granted") {
        const p = await Notification.requestPermission();
        if (p !== "granted") {
          toast("Permission not granted", "warn");
          return;
        }
      }
    }
    await patchMe({ desktopNotifications: on });
  };

  const revoke = async (id: string, current: boolean) => {
    try {
      await api("/api/sessions", { method: "DELETE", body: JSON.stringify({ id }) });
      if (current) {
        toast("This session was signed out", "success");
        void refresh();
      } else {
        toast("Session revoked", "success");
        loadSessions();
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't revoke", "error");
    }
  };

  if (!ready) return <div className="min-h-dvh flex items-center justify-center"><Spinner /></div>;
  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 pb-24">
        <EmptyState
          icon={ShieldCheck}
          title="Settings"
          sub="Sign in to manage privacy, notifications and sessions."
          action={<button onClick={() => promptAuth()} className="btn-primary rounded-xl px-6 py-3 text-sm font-bold text-white">Sign in</button>}
        />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-28 lg:pb-12">
      <h1 className="text-2xl font-extrabold mb-6">Settings</h1>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 mb-4">
        <div className="flex items-center gap-4">
          <Avatar src={user.avatarUrl} name={user.displayName} size={56} ring />
          <div className="flex-1 min-w-0">
            <p className="font-extrabold flex items-center gap-2">
              {user.displayName}
              {user.emailVerified && <BadgeCheck size={16} className="text-vado-cyan" />}
            </p>
            <p className="text-xs text-vado-sub">@{user.username} · {user.email}</p>
          </div>
          <Link href={`/profile/${user.username}`} className="glass-soft rounded-xl px-4 py-2 text-xs font-bold hover:bg-white/10 transition">
            View profile
          </Link>
        </div>
        {!user.emailVerified && (
          <p className="mt-3 text-[11px] text-vado-warn flex items-center gap-1.5">
            <AlertCircle size={12} /> Email not verified — resend from your profile page.
          </p>
        )}
        {user.role === "admin" && (
          <Link href="/admin" className="mt-3 glass-soft rounded-xl px-4 py-2.5 text-xs font-bold text-vado-warn flex items-center gap-2 w-fit hover:bg-white/10 transition">
            <ShieldCheck size={14} /> Open moderation console
          </Link>
        )}
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="glass rounded-3xl p-5 mb-4">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2"><Eye size={15} className="text-vado-cyan" /> Privacy</h2>
        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-semibold">Public liked videos</p>
            <p className="text-[11px] text-vado-sub">Show your Liked tab to other people</p>
          </div>
          <Toggle on={user.likedVideosPublic} onChange={(v) => void patchMe({ likedVideosPublic: v })} label="Public likes" />
        </div>
        <p className="text-[11px] text-vado-sub/70 mt-2">Your saved videos are always private. Blocked accounts can never see your content.</p>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="glass rounded-3xl p-5 mb-4">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2"><Bell size={15} className="text-vado-purple" /> Notifications</h2>
        <div className="flex items-center justify-between gap-4 py-2">
          <div>
            <p className="text-sm font-semibold flex items-center gap-2"><Monitor size={14} className="text-vado-sub" /> Desktop notifications</p>
            <p className="text-[11px] text-vado-sub">Get a system notification when new activity arrives while VADO is open</p>
          </div>
          <Toggle on={user.desktopNotifications} onChange={(v) => void toggleDesktop(v)} label="Desktop notifications" />
        </div>
        <p className="text-[11px] text-vado-sub/70 mt-2">In-app notifications are always on — check your Inbox badge.</p>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }} className="glass rounded-3xl p-5 mb-4">
        <h2 className="font-bold text-sm mb-4 flex items-center gap-2"><Smartphone size={15} className="text-vado-success" /> Active sessions</h2>
        {sessions === null ? (
          <div className="flex justify-center py-6"><Spinner size={22} /></div>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((s) => (
              <div key={s.id} className="glass-soft rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl glass-soft flex items-center justify-center shrink-0">
                  <Monitor size={15} className="text-vado-cyan" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold flex items-center gap-2">
                    {deviceOf(s.userAgent)}
                    {s.current && <span className="text-[9px] font-bold text-vado-success bg-vado-success/15 rounded-full px-2 py-0.5">This device</span>}
                  </p>
                  <p className="text-[10px] text-vado-sub truncate">Signed in {timeAgo(s.createdAt)} · expires {new Date(s.expiresAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => void revoke(s.id, s.current)}
                  className="glass-soft rounded-lg px-3 py-1.5 text-[10px] font-bold text-vado-danger hover:bg-vado-danger/15 transition flex items-center gap-1"
                >
                  <Trash2 size={11} /> Revoke
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="glass rounded-3xl p-5">
        <button onClick={() => void logout()} className="w-full rounded-2xl py-3 text-sm font-bold bg-vado-danger/15 border border-vado-danger/30 text-vado-danger hover:bg-vado-danger/25 transition flex items-center justify-center gap-2">
          <LogOut size={15} /> Sign out of VADO
        </button>
      </motion.section>
    </div>
  );
}
