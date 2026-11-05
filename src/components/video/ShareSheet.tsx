"use client";

import { useEffect, useState } from "react";
import { Link2, Share2, Send, Check, MessageSquare } from "lucide-react";
import { Modal, Avatar, Spinner } from "@/components/ui";
import { useApp } from "@/components/providers";
import { api, post } from "@/lib/client";
import type { ConversationDTO, VideoDTO } from "@/lib/types";

export function ShareSheet({
  video,
  open,
  onClose,
  onShared,
}: {
  video: VideoDTO | null;
  open: boolean;
  onClose: () => void;
  onShared: (id: string, count: number) => void;
}) {
  const { user, toast, promptAuth } = useApp();
  const [convos, setConvos] = useState<ConversationDTO[] | null>(null);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const link = video && typeof window !== "undefined" ? `${window.location.origin}/video/${video.id}` : "";

  useEffect(() => {
    if (open && user) {
      setConvos(null);
      setSentTo(new Set());
      api<{ conversations: ConversationDTO[] }>("/api/conversations")
        .then((d) => setConvos(d.conversations.slice(0, 6)))
        .catch(() => setConvos([]));
    }
    if (open) setCopied(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user?.id]);

  const registerShare = async () => {
    if (!video || !user) return;
    try {
      const r = await post<{ count: number }>(`/api/videos/${video.id}/share`);
      onShared(video.id, r.count);
    } catch { /* non-critical */ }
  };

  const copy = async () => {
    if (!user) return promptAuth("Sign in to share videos");
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast("Link copied to clipboard", "success");
      void registerShare();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Couldn't copy — long-press the link instead", "warn");
    }
  };

  const nativeShare = async () => {
    if (!user) return promptAuth("Sign in to share videos");
    try {
      await navigator.share({ title: `Watch ${video?.author.displayName} on VADO`, text: video?.caption ?? "", url: link });
      void registerShare();
    } catch { /* cancelled */ }
  };

  const sendTo = async (c: ConversationDTO) => {
    if (!video) return;
    try {
      await post(`/api/conversations/${c.id}/messages`, { body: "", videoId: video.id });
      setSentTo((s) => new Set(s).add(c.id));
      toast(`Sent to ${c.members[0]?.displayName ?? "chat"}`, "success");
      void registerShare();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't send", "error");
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Share this video">
      <div className="flex flex-col gap-4">
        <div className="glass-soft rounded-xl px-3.5 py-2.5 flex items-center gap-2">
          <Link2 size={14} className="text-vado-cyan shrink-0" />
          <span className="text-xs text-vado-sub truncate flex-1">{link}</span>
          <button onClick={() => void copy()} className="btn-primary rounded-lg px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 shrink-0">
            {copied ? <Check size={13} /> : <Link2 size={13} />} {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {typeof navigator !== "undefined" && "share" in navigator && (
          <button onClick={() => void nativeShare()} className="glass-soft rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-semibold hover:bg-white/10 transition">
            <span className="w-9 h-9 rounded-full bg-gradient-to-br from-vado-blue to-vado-purple flex items-center justify-center">
              <Share2 size={16} />
            </span>
            Share via device apps
          </button>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-vado-sub mb-2 flex items-center gap-1.5">
            <MessageSquare size={13} /> Send on VADO
          </p>
          {!user ? (
            <button onClick={() => promptAuth("Sign in to send videos")} className="w-full glass-soft rounded-xl px-4 py-3 text-sm text-vado-cyan font-semibold hover:bg-white/10 transition">
              Sign in to message creators →
            </button>
          ) : convos === null ? (
            <div className="flex justify-center py-4"><Spinner size={22} /></div>
          ) : convos.length === 0 ? (
            <p className="text-xs text-vado-sub glass-soft rounded-xl px-4 py-3">
              No conversations yet — open a creator's profile and tap Message to start one.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {convos.map((c) => (
                <div key={c.id} className="flex items-center gap-2.5 glass-soft rounded-xl px-3 py-2">
                  <Avatar src={c.members[0]?.avatarUrl} name={c.members[0]?.displayName ?? "Chat"} size={32} />
                  <span className="text-sm font-semibold flex-1 truncate">{c.members[0]?.displayName ?? "Conversation"}</span>
                  <button
                    onClick={() => void sendTo(c)}
                    disabled={sentTo.has(c.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold flex items-center gap-1 transition ${
                      sentTo.has(c.id) ? "bg-vado-success/20 text-vado-success" : "btn-primary text-white"
                    }`}
                  >
                    {sentTo.has(c.id) ? <><Check size={12} /> Sent</> : <><Send size={12} /> Send</>}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
