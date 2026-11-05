"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { X, MessageCircle, Send, Trash2, Flag, CornerDownRight } from "lucide-react";
import { Avatar, Spinner, EmptyState } from "@/components/ui";
import { useApp } from "@/components/providers";
import { api, post } from "@/lib/client";
import { timeAgo } from "@/lib/format";
import type { CommentDTO, VideoDTO } from "@/lib/types";
import { ReportModal } from "./ReportModal";

export function CommentsPanel({
  video,
  open,
  onClose,
  onCountChange,
}: {
  video: VideoDTO | null;
  open: boolean;
  onClose: () => void;
  onCountChange: (id: string, count: number) => void;
}) {
  const { user, toast, promptAuth } = useApp();
  const [comments, setComments] = useState<CommentDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<CommentDTO | null>(null);
  const [sending, setSending] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ type: "comment"; id: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  const videoId = video?.id ?? null;
  const load = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    try {
      const data = await api<{ comments: CommentDTO[]; total: number }>(`/api/videos/${videoId}/comments`);
      setComments(data.comments);
      setTotal(data.total);
      onCountChange(videoId, data.total);
    } catch {
      toast("Couldn't load comments", "error");
    } finally {
      setLoading(false);
    }
  }, [videoId, toast, onCountChange]);

  useEffect(() => {
    if (open && videoId) {
      setReplyTo(null);
      setBody("");
      void load();
    }
  }, [open, videoId, load]);

  const submit = async () => {
    if (!video || !body.trim()) return;
    if (!user) return promptAuth("Sign in to join the conversation");
    setSending(true);
    const text = body.trim();
    try {
      const data = await post<{ comment: CommentDTO }>(`/api/videos/${video.id}/comments`, {
        body: text,
        parentId: replyTo?.id ?? null,
      });
      setComments((prev) => {
        if (data.comment.parentId) {
          return prev.map((c) => (c.id === data.comment.parentId ? { ...c, replies: [...c.replies, data.comment] } : c));
        }
        return [data.comment, ...prev];
      });
      setTotal((t) => {
        onCountChange(video.id, t + 1);
        return t + 1;
      });
      setBody("");
      setReplyTo(null);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't post comment", "error");
    } finally {
      setSending(false);
    }
  };

  const remove = async (c: CommentDTO) => {
    if (!video) return;
    const removedCount = 1 + c.replies.length;
    const prev = comments;
    setComments((p) => p.filter((x) => x.id !== c.id).map((x) => ({ ...x, replies: x.replies.filter((r) => r.id !== c.id) })));
    setTotal((t) => {
      const n = Math.max(0, t - removedCount);
      onCountChange(video.id, n);
      return n;
    });
    try {
      await api(`/api/comments/${c.id}`, { method: "DELETE" });
      toast("Comment deleted", "success");
    } catch (e) {
      setComments(prev);
      toast(e instanceof Error ? e.message : "Couldn't delete", "error");
    }
  };

  const renderComment = (c: CommentDTO, isReply = false) => (
    <motion.div
      key={c.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2.5 ${isReply ? "ml-9 mt-2.5" : ""}`}
    >
      <Link href={`/profile/${c.user.username}`} onClick={onClose}>
        <Avatar src={c.user.avatarUrl} name={c.user.displayName} size={isReply ? 26 : 32} />
      </Link>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <Link href={`/profile/${c.user.username}`} onClick={onClose} className="text-xs font-bold text-vado-text hover:text-vado-cyan transition">
            {c.user.displayName}
          </Link>
          <span className="text-[10px] text-vado-sub/70">{timeAgo(c.createdAt)}</span>
        </div>
        <p className="text-[13px] text-vado-text/90 leading-snug break-words mt-0.5">{c.body}</p>
        <div className="flex items-center gap-3 mt-1">
          {!isReply && (
            <button
              onClick={() => {
                setReplyTo(c);
                inputRef.current?.focus();
              }}
              className="text-[11px] font-semibold text-vado-sub hover:text-vado-cyan transition"
            >
              Reply
            </button>
          )}
          {c.canDelete && (
            <button onClick={() => void remove(c)} className="text-vado-sub/60 hover:text-vado-danger transition" aria-label="Delete comment">
              <Trash2 size={12} />
            </button>
          )}
          {user && c.user.id !== user.id && (
            <button onClick={() => setReportTarget({ type: "comment", id: c.id })} className="text-vado-sub/60 hover:text-vado-warn transition" aria-label="Report comment">
              <Flag size={12} />
            </button>
          )}
        </div>
        {c.replies.map((r) => renderComment(r, true))}
      </div>
    </motion.div>
  );

  if (!mounted) return null;
  return createPortal(
    <>
      <AnimatePresence>
        {open && video && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100]" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 lg:bg-black/20" />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 360, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 inset-x-0 h-[72dvh] lg:inset-x-auto lg:right-0 lg:top-0 lg:bottom-0 lg:h-full lg:w-[420px] glass-deep rounded-t-3xl lg:rounded-none lg:border-l border-white/12 flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
                <h3 className="font-bold text-sm">
                  Comments <span className="text-vado-cyan">{total}</span>
                </h3>
                <button onClick={onClose} className="w-8 h-8 rounded-full glass-soft flex items-center justify-center hover:bg-white/10 transition" aria-label="Close comments">
                  <X size={15} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
                {loading ? (
                  <div className="flex justify-center py-10"><Spinner /></div>
                ) : comments.length === 0 ? (
                  <EmptyState icon={MessageCircle} title="No comments yet" sub="Be the first to say something nice." />
                ) : (
                  comments.map((c) => renderComment(c))
                )}
              </div>

              <div className="border-t border-white/10 p-3.5 pb-[max(14px,env(safe-area-inset-bottom))]">
                <AnimatePresence>
                  {replyTo && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 text-[11px] text-vado-cyan px-2 pb-2 overflow-hidden"
                    >
                      <CornerDownRight size={12} /> Replying to {replyTo.user.displayName}
                      <button onClick={() => setReplyTo(null)} className="ml-1 text-vado-sub hover:text-white"><X size={12} /></button>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="flex items-center gap-2">
                  <Avatar src={user?.avatarUrl} name={user?.displayName ?? "Guest"} size={32} />
                  <input
                    ref={inputRef}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !sending && void submit()}
                    onFocus={() => !user && promptAuth("Sign in to comment")}
                    placeholder={user ? "Add a comment…" : "Sign in to comment"}
                    maxLength={500}
                    className="glass-input flex-1 rounded-full px-4 py-2.5 text-sm placeholder:text-vado-sub/50"
                  />
                  <button
                    onClick={() => void submit()}
                    disabled={!body.trim() || sending}
                    className="btn-primary w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    aria-label="Send comment"
                  >
                    <Send size={16} className="text-white" />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ReportModal open={!!reportTarget} onClose={() => setReportTarget(null)} target={reportTarget} />
    </>,
    document.body
  );
}
