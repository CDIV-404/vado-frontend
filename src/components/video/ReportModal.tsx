"use client";

import { useState } from "react";
import { Flag, ShieldCheck } from "lucide-react";
import { Modal, inputCls } from "@/components/ui";
import { useApp } from "@/components/providers";
import { post } from "@/lib/client";

const REASONS = [
  "Spam or scam",
  "Harassment or hate",
  "Nudity or sexual content",
  "Violence or dangerous acts",
  "Misleading information",
  "Intellectual property",
  "Something else",
];

export function ReportModal({
  open,
  onClose,
  target,
}: {
  open: boolean;
  onClose: () => void;
  target: { type: "video" | "comment" | "user"; id: string } | null;
}) {
  const { toast } = useApp();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!target || !reason) return;
    setBusy(true);
    try {
      const path =
        target.type === "video"
          ? `/api/videos/${target.id}/report`
          : target.type === "comment"
            ? `/api/comments/${target.id}`
            : `/api/users/${target.id}/report`;
      await post(path, { reason, details });
      setDone(true);
      setTimeout(() => {
        onClose();
        setDone(false);
        setReason("");
        setDetails("");
      }, 1600);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't send report", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Report ${target?.type ?? ""}`}>
      {done ? (
        <div className="py-8 flex flex-col items-center gap-3 text-center">
          <span className="w-14 h-14 rounded-full bg-vado-success/15 flex items-center justify-center">
            <ShieldCheck size={26} className="text-vado-success" />
          </span>
          <p className="font-bold">Report received</p>
          <p className="text-sm text-vado-sub">Our moderation team will review it. Thanks for keeping VADO safe.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-xs text-vado-sub mb-1 flex items-center gap-1.5">
            <Flag size={13} className="text-vado-danger" /> Reports are anonymous and reviewed by moderators.
          </p>
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition border ${
                reason === r
                  ? "bg-vado-blue/20 border-vado-blue/50 text-white"
                  : "glass-soft border-transparent text-vado-sub hover:text-vado-text hover:bg-white/8"
              }`}
            >
              {r}
            </button>
          ))}
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add context (optional)"
            rows={2}
            maxLength={1000}
            className={`${inputCls} mt-1 resize-none`}
          />
          <button
            onClick={() => void submit()}
            disabled={!reason || busy}
            className="btn-primary rounded-xl py-2.5 text-sm font-bold text-white mt-1"
          >
            {busy ? "Sending…" : "Submit report"}
          </button>
        </div>
      )}
    </Modal>
  );
}
