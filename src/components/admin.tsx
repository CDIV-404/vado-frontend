"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ShieldCheck, Users, Film, Heart, MessageCircle, Eye, Flag, Search, Ban,
  RotateCcw, Trash2, XCircle, ScrollText, BarChart3, AlertTriangle,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { Avatar, Spinner, EmptyState, Modal, inputCls } from "@/components/ui";
import { api, post } from "@/lib/client";
import { formatCount, timeAgo } from "@/lib/format";

type Totals = Record<string, number>;
type Daily = { day: string; signups: number; uploads: number; views: number };
type AdminUser = {
  id: string; email: string; username: string; displayName: string; avatarUrl: string | null;
  role: string; status: string; emailVerified: boolean; createdAt: string;
  videos: number; followers: number; reports: number;
};
type Report = {
  id: string; targetType: string; targetId: string; reason: string; details: string;
  status: string; resolution: string; createdAt: string; reporterName: string;
  targetPreview: string; targetThumb: string | null; ownerId: string | null;
};
type Log = { id: string; action: string; targetType: string; targetId: string | null; details: string; createdAt: string; admin: string };

const TABS = ["overview", "users", "reports", "audit"] as const;

export function AdminView() {
  const { user, ready, toast } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>("overview");
  const [totals, setTotals] = useState<Totals | null>(null);
  const [daily, setDaily] = useState<Daily[]>([]);
  const [metric, setMetric] = useState<"views" | "uploads" | "signups">("views");
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [userQ, setUserQ] = useState("");
  const [reports, setReports] = useState<Report[] | null>(null);
  const [reportStatus, setReportStatus] = useState("open");
  const [logs, setLogs] = useState<Log[] | null>(null);
  const [confirm, setConfirm] = useState<{ type: string; targetId: string; reportId?: string; label: string } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const loadOverview = useCallback(async () => {
    try {
      const d = await api<{ totals: Totals; daily: Daily[] }>("/api/admin/overview");
      setTotals(d.totals);
      setDaily(d.daily);
    } catch { /* guarded */ }
  }, []);

  const loadUsers = useCallback(async (q: string) => {
    setUsers(null);
    try {
      const d = await api<{ users: AdminUser[] }>(`/api/admin/users?q=${encodeURIComponent(q)}`);
      setUsers(d.users);
    } catch { setUsers([]); }
  }, []);

  const loadReports = useCallback(async (status: string) => {
    setReports(null);
    try {
      const d = await api<{ reports: Report[] }>(`/api/admin/reports?status=${status}`);
      setReports(d.reports);
    } catch { setReports([]); }
  }, []);

  const loadLogs = useCallback(async () => {
    try {
      const d = await api<{ logs: Log[] }>("/api/admin/action");
      setLogs(d.logs);
    } catch { setLogs([]); }
  }, []);

  useEffect(() => {
    if (!ready || user?.role !== "admin") return;
    if (tab === "overview") void loadOverview();
    if (tab === "users") void loadUsers(userQ);
    if (tab === "reports") void loadReports(reportStatus);
    if (tab === "audit") void loadLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, user?.role, tab, reportStatus]);

  const runAction = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      await post("/api/admin/action", { type: confirm.type, targetId: confirm.targetId, reportId: confirm.reportId, reason });
      toast("Moderation action applied", "success");
      setConfirm(null);
      setReason("");
      if (tab === "users") void loadUsers(userQ);
      if (tab === "reports") void loadReports(reportStatus);
      if (tab === "overview") void loadOverview();
      void loadLogs();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Action failed", "error");
    } finally {
      setBusy(false);
    }
  };

  if (!ready) return <div className="min-h-dvh flex items-center justify-center"><Spinner /></div>;
  if (user?.role !== "admin") {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 pb-24">
        <EmptyState
          icon={ShieldCheck}
          title="Moderation console"
          sub="This area is restricted to authorized VADO administrators. There is no public admin registration."
          action={<Link href="/feed" className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white">Back to the feed</Link>}
        />
      </div>
    );
  }

  const maxDaily = Math.max(1, ...daily.map((d) => d[metric]));

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-28 lg:pb-12">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-vado-warn/30 to-vado-danger/20 border border-vado-warn/30 flex items-center justify-center">
          <ShieldCheck size={20} className="text-vado-warn" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold">Moderation console</h1>
          <p className="text-xs text-vado-sub">Every action is written to the audit log.</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-6 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-4 py-2.5 rounded-xl text-xs font-bold capitalize whitespace-nowrap transition ${tab === t ? "text-white" : "text-vado-sub glass-soft hover:text-vado-text"}`}
          >
            {tab === t && (
              <motion.span layoutId="admin-tab" className="absolute inset-0 rounded-xl bg-gradient-to-r from-vado-warn/50 to-vado-danger/40" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
            )}
            <span className="relative">{t === "audit" ? "Audit log" : t}</span>
          </button>
        ))}
      </div>

      {tab === "overview" && (
        totals === null ? <div className="flex justify-center py-16"><Spinner /></div> : (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { k: "users", label: "Registered users", icon: Users, hue: "text-vado-cyan", sub: `+${totals.new_users ?? 0} this week` },
                { k: "videos", label: "Published videos", icon: Film, hue: "text-vado-blue", sub: `${totals.drafts ?? 0} drafts` },
                { k: "views", label: "Total views", icon: Eye, hue: "text-vado-purple", sub: "from real watch events" },
                { k: "likes", label: "Likes", icon: Heart, hue: "text-[#FF5C7A]", sub: `${totals.follows ?? 0} follows` },
                { k: "comments", label: "Comments", icon: MessageCircle, hue: "text-vado-success", sub: "visible" },
                { k: "open_reports", label: "Open reports", icon: Flag, hue: "text-vado-warn", sub: `${totals.suspended ?? 0} suspended` },
              ].map((c, i) => (
                <motion.div key={c.k} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass rounded-2xl p-4">
                  <c.icon size={17} className={c.hue} />
                  <p className="text-2xl font-extrabold mt-2">{formatCount(totals[c.k] ?? 0)}</p>
                  <p className="text-[11px] font-bold text-vado-sub">{c.label}</p>
                  <p className="text-[10px] text-vado-sub/60 mt-0.5">{c.sub}</p>
                </motion.div>
              ))}
            </div>
            <div className="glass rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h3 className="font-bold text-sm flex items-center gap-2"><BarChart3 size={15} className="text-vado-cyan" /> Last 14 days</h3>
                <div className="flex gap-1.5">
                  {(["views", "uploads", "signups"] as const).map((m) => (
                    <button key={m} onClick={() => setMetric(m)} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold capitalize transition ${metric === m ? "bg-vado-blue/30 text-white border border-vado-blue/40" : "glass-soft text-vado-sub"}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end gap-1.5 h-36">
                {daily.map((d) => (
                  <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <span className="absolute -top-6 text-[9px] font-bold text-vado-cyan opacity-0 group-hover:opacity-100 transition">{d[metric]}</span>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${Math.max(3, (d[metric] / maxDaily) * 100)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="w-full rounded-t-md bg-gradient-to-t from-vado-blue/60 to-vado-cyan/80 group-hover:from-vado-purple/70 group-hover:to-vado-cyan transition-colors"
                    />
                    <span className="text-[8px] text-vado-sub/60">{d.day.slice(8)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {tab === "users" && (
        <div>
          <div className="glass rounded-2xl flex items-center gap-3 px-4 py-2.5 mb-4">
            <Search size={15} className="text-vado-cyan" />
            <input
              value={userQ}
              onChange={(e) => setUserQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadUsers(userQ)}
              placeholder="Search by name, @handle or email… (Enter)"
              className="bg-transparent flex-1 outline-none text-sm placeholder:text-vado-sub/50"
            />
          </div>
          {users === null ? <div className="flex justify-center py-12"><Spinner /></div> : (
            <div className="flex flex-col gap-2">
              {users.map((u) => (
                <div key={u.id} className="glass-soft rounded-2xl px-4 py-3 flex items-center gap-3 flex-wrap">
                  <Avatar src={u.avatarUrl} name={u.displayName} size={38} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold flex items-center gap-2 flex-wrap">
                      <Link href={`/profile/${u.username}`} className="hover:text-vado-cyan transition">{u.displayName}</Link>
                      <span className="text-[10px] text-vado-sub">@{u.username}</span>
                      {u.role === "admin" && <span className="text-[9px] font-bold text-vado-warn bg-vado-warn/15 rounded-full px-2 py-0.5">ADMIN</span>}
                      {u.status === "suspended" && <span className="text-[9px] font-bold text-vado-danger bg-vado-danger/15 rounded-full px-2 py-0.5">SUSPENDED</span>}
                    </p>
                    <p className="text-[10px] text-vado-sub truncate">{u.email} · {u.videos} videos · {formatCount(u.followers)} followers · {u.reports} reports · joined {timeAgo(u.createdAt)}</p>
                  </div>
                  {u.role !== "admin" && (
                    u.status === "active" ? (
                      <button
                        onClick={() => setConfirm({ type: "suspend", targetId: u.id, label: `Suspend @${u.username}? Their content disappears and sessions are revoked.` })}
                        className="rounded-lg px-3 py-1.5 text-[10px] font-bold bg-vado-danger/15 border border-vado-danger/30 text-vado-danger hover:bg-vado-danger/25 transition flex items-center gap-1"
                      >
                        <Ban size={11} /> Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirm({ type: "restore", targetId: u.id, label: `Restore @${u.username}?` })}
                        className="rounded-lg px-3 py-1.5 text-[10px] font-bold bg-vado-success/15 border border-vado-success/30 text-vado-success hover:bg-vado-success/25 transition flex items-center gap-1"
                      >
                        <RotateCcw size={11} /> Restore
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "reports" && (
        <div>
          <div className="flex gap-1.5 mb-4">
            {["open", "resolved", "dismissed"].map((s) => (
              <button key={s} onClick={() => setReportStatus(s)} className={`rounded-lg px-3.5 py-2 text-[11px] font-bold capitalize transition ${reportStatus === s ? "bg-vado-warn/25 text-white border border-vado-warn/40" : "glass-soft text-vado-sub"}`}>
                {s}
              </button>
            ))}
          </div>
          {reports === null ? <div className="flex justify-center py-12"><Spinner /></div> : reports.length === 0 ? (
            <EmptyState icon={ShieldCheck} title={`No ${reportStatus} reports`} sub="The queue is clear. New reports from the community land here instantly." />
          ) : (
            <div className="flex flex-col gap-3">
              {reports.map((r) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl p-4">
                  <div className="flex items-start gap-3">
                    {r.targetThumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.targetThumb} alt="" className="w-12 h-16 rounded-lg object-cover border border-white/10 shrink-0" />
                    ) : (
                      <span className="w-12 h-12 rounded-xl glass-soft flex items-center justify-center shrink-0">
                        <Flag size={16} className="text-vado-warn" />
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold flex items-center gap-2 flex-wrap">
                        <span className="text-vado-warn flex items-center gap-1"><AlertTriangle size={12} /> {r.reason}</span>
                        <span className="glass-soft rounded-full px-2 py-0.5 text-[9px] uppercase">{r.targetType}</span>
                        <span className="text-vado-sub/70 font-medium">by @{r.reporterName} · {timeAgo(r.createdAt)}</span>
                      </p>
                      <p className="text-sm text-vado-text/90 mt-1.5 line-clamp-2">“{r.targetPreview}”</p>
                      {r.details && <p className="text-[11px] text-vado-sub mt-1">{r.details}</p>}
                      {r.resolution && <p className="text-[11px] text-vado-success mt-1">Resolution: {r.resolution}</p>}
                    </div>
                  </div>
                  {r.status === "open" && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {r.targetType === "video" && (
                        <button onClick={() => setConfirm({ type: "remove_video", targetId: r.targetId, reportId: r.id, label: "Remove this video? The creator is notified." })} className="rounded-lg px-3 py-1.5 text-[10px] font-bold bg-vado-danger/15 border border-vado-danger/30 text-vado-danger hover:bg-vado-danger/25 transition flex items-center gap-1">
                          <Trash2 size={11} /> Remove video
                        </button>
                      )}
                      {r.targetType === "comment" && (
                        <button onClick={() => setConfirm({ type: "remove_comment", targetId: r.targetId, reportId: r.id, label: "Remove this comment and its replies?" })} className="rounded-lg px-3 py-1.5 text-[10px] font-bold bg-vado-danger/15 border border-vado-danger/30 text-vado-danger hover:bg-vado-danger/25 transition flex items-center gap-1">
                          <Trash2 size={11} /> Remove comment
                        </button>
                      )}
                      {r.ownerId && (
                        <button onClick={() => setConfirm({ type: "suspend", targetId: r.ownerId!, reportId: r.id, label: "Suspend the content owner?" })} className="rounded-lg px-3 py-1.5 text-[10px] font-bold bg-vado-warn/15 border border-vado-warn/30 text-vado-warn hover:bg-vado-warn/25 transition flex items-center gap-1">
                          <Ban size={11} /> Suspend owner
                        </button>
                      )}
                      <button onClick={() => setConfirm({ type: "dismiss_report", targetId: r.targetId, reportId: r.id, label: "Dismiss this report as not violating?" })} className="rounded-lg px-3 py-1.5 text-[10px] font-bold glass-soft text-vado-sub hover:bg-white/10 transition flex items-center gap-1">
                        <XCircle size={11} /> Dismiss
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "audit" && (
        logs === null ? <div className="flex justify-center py-12"><Spinner /></div> : logs.length === 0 ? (
          <EmptyState icon={ScrollText} title="No moderation actions yet" sub="Every suspend, removal and dismissal is recorded here." />
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((l) => (
              <div key={l.id} className="glass-soft rounded-2xl px-4 py-3 flex items-center gap-3">
                <span className="w-8 h-8 rounded-lg glass-soft flex items-center justify-center shrink-0">
                  <ScrollText size={13} className="text-vado-cyan" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">
                    <span className="text-vado-cyan">@{l.admin}</span>{" "}
                    <span className="text-vado-text">{l.action.replace(/_/g, " ")}</span>{" "}
                    <span className="text-vado-sub">({l.targetType})</span>
                  </p>
                  <p className="text-[10px] text-vado-sub truncate">{l.details} · {timeAgo(l.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title="Confirm moderation action">
        <p className="text-sm text-vado-sub leading-relaxed">{confirm?.label}</p>
        <input className={`${inputCls} mt-4`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (recorded in audit log)" maxLength={300} />
        <div className="flex gap-2.5 mt-5">
          <button onClick={() => setConfirm(null)} className="flex-1 glass-soft rounded-xl py-2.5 text-sm font-bold hover:bg-white/10 transition">Cancel</button>
          <button onClick={() => void runAction()} disabled={busy} className="flex-1 rounded-xl py-2.5 text-sm font-bold bg-vado-danger/90 hover:bg-vado-danger text-white transition">
            {busy ? "Applying…" : "Apply action"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
