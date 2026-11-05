"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, Heart, MessageCircle, UserPlus, AtSign, Send, Info, CornerDownRight, Repeat2,
  ArrowLeft, CheckCheck, Check, MessageSquare, LogIn, Play,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { Avatar, Spinner, EmptyState } from "@/components/ui";
import { api, post } from "@/lib/client";
import { timeAgo } from "@/lib/format";
import type { NotificationDTO, ConversationDTO, MessageDTO } from "@/lib/types";

const KIND_META: Record<string, { icon: React.ReactNode; text: (n: NotificationDTO) => string }> = {
  like: { icon: <Heart size={14} fill="#FF5C7A" className="text-[#FF5C7A]" />, text: () => "liked your video" },
  comment: { icon: <MessageCircle size={14} className="text-vado-blue" />, text: (n) => `commented: ${n.body}` },
  reply: { icon: <CornerDownRight size={14} className="text-vado-purple" />, text: (n) => `replied: ${n.body}` },
  follow: { icon: <UserPlus size={14} className="text-vado-cyan" />, text: () => "started following you" },
  mention: { icon: <AtSign size={14} className="text-[#FF5CA8]" />, text: (n) => `mentioned you: ${n.body}` },
  message: { icon: <Send size={14} className="text-vado-cyan" />, text: (n) => n.body || "sent you a message" },
  system: { icon: <Info size={14} className="text-vado-warn" />, text: (n) => n.body || "Account update" },
  repost: { icon: <Repeat2 size={14} className="text-vado-success" />, text: () => "reposted your video" },
};

export function InboxView() {
  const { user, ready, setUnread, toast, promptAuth } = useApp();
  const params = useSearchParams();
  const initialConvo = params.get("c");
  const [tab, setTab] = useState<"activity" | "messages">(initialConvo ? "messages" : "activity");
  const [notifs, setNotifs] = useState<NotificationDTO[] | null>(null);
  const [convos, setConvos] = useState<ConversationDTO[] | null>(null);
  const [active, setActive] = useState<ConversationDTO | null>(null);
  const [messages, setMessages] = useState<MessageDTO[]>([]);
  const [seenThrough, setSeenThrough] = useState<string | null>(null);
  const [msgLoading, setMsgLoading] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const openedInitial = useRef(false);

  const loadNotifs = useCallback(async () => {
    try {
      const d = await api<{ notifications: NotificationDTO[]; unread: number }>("/api/notifications");
      setNotifs(d.notifications);
      if (d.unread > 0) {
        setTimeout(() => {
          void post("/api/notifications", { action: "read_all" }).catch(() => {});
          setUnread(0);
        }, 1200);
      }
    } catch {
      setNotifs([]);
    }
  }, [setUnread]);

  const loadConvos = useCallback(async () => {
    try {
      const d = await api<{ conversations: ConversationDTO[] }>("/api/conversations");
      setConvos(d.conversations);
      return d.conversations;
    } catch {
      setConvos([]);
      return [];
    }
  }, []);

  const loadMessages = useCallback(async (convoId: string, silent = false) => {
    if (!silent) setMsgLoading(true);
    try {
      const d = await api<{ messages: MessageDTO[]; seenThrough: string | null }>(`/api/conversations/${convoId}/messages`);
      setMessages(d.messages);
      setSeenThrough(d.seenThrough);
    } catch {
      if (!silent) toast("Couldn't load messages", "error");
    } finally {
      setMsgLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!user || !ready) return;
    if (tab === "activity") void loadNotifs();
    else void loadConvos().then((list) => {
      if (initialConvo && !openedInitial.current) {
        openedInitial.current = true;
        const c = list.find((x) => x.id === initialConvo);
        if (c) {
          setActive(c);
          void loadMessages(c.id);
        }
      }
    });
  }, [user, ready, tab, loadNotifs, loadConvos, loadMessages, initialConvo]);

  /* Polling: chat when open, list otherwise */
  useEffect(() => {
    if (!user || tab !== "messages") return;
    const t = setInterval(() => {
      if (active) void loadMessages(active.id, true);
      else void loadConvos();
    }, 5000);
    return () => clearInterval(t);
  }, [user, tab, active, loadMessages, loadConvos]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const openConvo = (c: ConversationDTO) => {
    setActive(c);
    setMessages([]);
    void loadMessages(c.id);
    setConvos((p) => p?.map((x) => (x.id === c.id ? { ...x, unread: 0 } : x)) ?? null);
  };

  const sendMsg = async () => {
    if (!active || !body.trim() || sending) return;
    setSending(true);
    const text = body.trim();
    setBody("");
    try {
      const d = await post<{ message: MessageDTO }>(`/api/conversations/${active.id}/messages`, { body: text });
      setMessages((p) => [...p, d.message]);
      void loadConvos();
    } catch (e) {
      setBody(text);
      toast(e instanceof Error ? e.message : "Couldn't send", "error");
    } finally {
      setSending(false);
    }
  };

  const onNotifClick = (n: NotificationDTO) => {
    if (n.kind === "message" && n.conversationId) {
      setTab("messages");
      void loadConvos().then((list) => {
        const c = list.find((x) => x.id === n.conversationId);
        if (c) openConvo(c);
      });
    }
  };

  if (!ready) return <div className="min-h-dvh flex items-center justify-center"><Spinner /></div>;
  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 pb-24">
        <EmptyState
          icon={Bell}
          title="Your inbox lives here"
          sub="Sign in to see likes, comments, new followers and private messages."
          action={
            <button onClick={() => promptAuth()} className="btn-primary rounded-xl px-6 py-3 text-sm font-bold text-white flex items-center gap-2">
              <LogIn size={15} /> Sign in
            </button>
          }
        />
      </div>
    );
  }

  const chatPane = active && (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
        <button onClick={() => { setActive(null); void loadConvos(); }} className="w-8 h-8 rounded-full glass-soft flex items-center justify-center hover:bg-white/10 transition" aria-label="Back to conversations">
          <ArrowLeft size={15} />
        </button>
        <Avatar src={active.members[0]?.avatarUrl} name={active.members[0]?.displayName ?? "Chat"} size={34} />
        <div className="min-w-0">
          <Link href={`/profile/${active.members[0]?.username ?? ""}`} className="font-bold text-sm truncate block hover:text-vado-cyan transition">
            {active.isGroup ? active.title || "Group chat" : active.members[0]?.displayName}
          </Link>
          <span className="text-[10px] text-vado-sub">@{active.members[0]?.username}</span>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2.5 min-h-0">
        {msgLoading ? (
          <div className="flex justify-center py-8"><Spinner size={22} /></div>
        ) : messages.length === 0 ? (
          <p className="text-center text-xs text-vado-sub py-8">Say hi 👋 — messages are private between you two.</p>
        ) : (
          messages.map((m, i) => {
            const lastMine = m.mine && i === messages.map((x) => x.mine).lastIndexOf(true);
            const seen = lastMine && seenThrough && new Date(seenThrough) >= new Date(m.createdAt);
            return (
              <div key={m.id} className={`flex flex-col ${m.mine ? "items-end" : "items-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-snug ${
                  m.mine
                    ? "bg-gradient-to-r from-vado-blue to-vado-purple text-white rounded-br-md"
                    : "glass-soft rounded-bl-md"
                }`}>
                  {m.video && (
                    <Link href={`/video/${m.video.id}`} className="block mb-1.5 rounded-xl overflow-hidden border border-white/20 relative w-36 aspect-[9/14] bg-black/30">
                      {m.video.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.video.thumbnailUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="glass-deep w-9 h-9 rounded-full flex items-center justify-center"><Play size={14} fill="white" /></span>
                      </span>
                      <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-semibold truncate">{m.video.caption || "Shared video"}</span>
                    </Link>
                  )}
                  {m.body}
                </div>
                <span className="text-[9px] text-vado-sub/70 mt-1 px-1 flex items-center gap-1">
                  {timeAgo(m.createdAt)}
                  {lastMine && (seen ? <span className="text-vado-cyan flex items-center gap-0.5"><CheckCheck size={11} /> Seen</span> : <span className="flex items-center gap-0.5"><Check size={11} /> Sent</span>)}
                </span>
              </div>
            );
          })
        )}
      </div>
      <div className="border-t border-white/10 p-3 flex items-center gap-2 pb-[max(12px,env(safe-area-inset-bottom))]">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void sendMsg()}
          placeholder="Message…"
          maxLength={1000}
          className="glass-input flex-1 rounded-full px-4 py-2.5 text-sm placeholder:text-vado-sub/50"
        />
        <button onClick={() => void sendMsg()} disabled={!body.trim() || sending} className="btn-primary w-10 h-10 rounded-full flex items-center justify-center shrink-0" aria-label="Send message">
          <Send size={16} className="text-white" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6 pb-28 lg:pb-12">
      <h1 className="text-2xl font-extrabold mb-5">Inbox</h1>
      <div className="glass-soft rounded-2xl p-1 flex w-fit mb-6">
        {(["activity", "messages"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`relative px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition ${tab === t ? "text-white" : "text-vado-sub"}`}
          >
            {tab === t && (
              <motion.span layoutId="inbox-tab" className="absolute inset-0 rounded-xl bg-gradient-to-r from-vado-blue/70 to-vado-purple/70" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
            )}
            <span className="relative">{t}</span>
          </button>
        ))}
      </div>

      {tab === "activity" ? (
        notifs === null ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : notifs.length === 0 ? (
          <EmptyState icon={Bell} title="No notifications yet" sub="Likes, comments, follows and mentions will show up here the moment they happen." />
        ) : (
          <div className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {notifs.map((n, i) => {
                const meta = KIND_META[n.kind] ?? KIND_META.system;
                const inner = (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.03, 0.3) }}
                    className={`glass-soft rounded-2xl px-4 py-3 flex items-center gap-3 hover:bg-white/8 transition ${!n.read ? "border-vado-blue/30 shadow-[0_0_20px_rgba(40,124,255,0.08)]" : ""}`}
                  >
                    <span className="relative shrink-0">
                      <Avatar src={n.actor?.avatarUrl} name={n.actor?.displayName ?? "VADO"} size={42} />
                      <span className="absolute -bottom-1 -right-1 w-5.5 h-5.5 glass-deep rounded-full flex items-center justify-center" style={{ width: 22, height: 22 }}>
                        {meta.icon}
                      </span>
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] leading-snug">
                        <b>{n.actor?.displayName ?? "VADO"}</b>{" "}
                        <span className="text-vado-sub">{meta.text(n)}</span>
                      </p>
                      <span className="text-[10px] text-vado-sub/70">{timeAgo(n.createdAt)}</span>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-vado-cyan shrink-0 shadow-[0_0_8px_rgba(56,201,255,0.9)]" />}
                    {n.videoThumb && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={n.videoThumb} alt="" className="w-10 h-14 rounded-lg object-cover border border-white/10 shrink-0" />
                    )}
                  </motion.div>
                );
                if (n.kind === "message") return <button key={n.id} onClick={() => onNotifClick(n)} className="text-left">{inner}</button>;
                if (n.videoId) return <Link key={n.id} href={`/video/${n.videoId}`}>{inner}</Link>;
                if (n.actor) return <Link key={n.id} href={`/profile/${n.actor.username}`}>{inner}</Link>;
                return <div key={n.id}>{inner}</div>;
              })}
            </AnimatePresence>
          </div>
        )
      ) : (
        <div className="glass rounded-3xl overflow-hidden md:grid md:grid-cols-[300px_1fr]" style={{ height: "min(640px, calc(100dvh - 230px))" }}>
          {/* Conversation list */}
          <div className={`border-r border-white/10 overflow-y-auto ${active ? "hidden md:block" : "block"}`}>
            {convos === null ? (
              <div className="flex justify-center py-10"><Spinner size={22} /></div>
            ) : convos.length === 0 ? (
              <div className="p-6 text-center">
                <MessageSquare size={26} className="text-vado-cyan mx-auto mb-3" />
                <p className="font-bold text-sm">No conversations yet</p>
                <p className="text-xs text-vado-sub mt-1.5 leading-relaxed">Open a creator&apos;s profile and tap <b>Message</b> to start chatting.</p>
              </div>
            ) : (
              convos.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openConvo(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/6 transition text-left border-b border-white/5 ${active?.id === c.id ? "bg-white/8" : ""}`}
                >
                  <Avatar src={c.members[0]?.avatarUrl} name={c.members[0]?.displayName ?? "Chat"} size={42} />
                  <span className="flex-1 min-w-0">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="font-bold text-sm truncate">{c.isGroup ? c.title || "Group" : c.members[0]?.displayName}</span>
                      <span className="text-[9px] text-vado-sub/70 shrink-0">{timeAgo(c.lastMessageAt)}</span>
                    </span>
                    <span className={`block text-xs truncate mt-0.5 ${c.unread > 0 ? "text-vado-text font-semibold" : "text-vado-sub"}`}>
                      {c.lastSenderIsMe && "You: "}{c.lastBody || "Start the conversation"}
                    </span>
                  </span>
                  {c.unread > 0 && (
                    <span className="min-w-5 h-5 px-1.5 rounded-full bg-gradient-to-r from-vado-blue to-vado-purple text-[10px] font-bold flex items-center justify-center shrink-0">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
          {/* Desktop chat */}
          <div className="hidden md:flex flex-col min-h-0">
            {active ? chatPane : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center p-8">
                <span className="w-16 h-16 rounded-full glass-soft flex items-center justify-center"><MessageSquare size={26} className="text-vado-cyan" /></span>
                <p className="font-bold">Pick a conversation</p>
                <p className="text-xs text-vado-sub max-w-52">Your messages sync in real time with read receipts.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile chat overlay */}
      <AnimatePresence>
        {tab === "messages" && active && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 360, damping: 36 }}
            className="md:hidden fixed inset-0 z-[70] glass-deep"
          >
            {chatPane}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
