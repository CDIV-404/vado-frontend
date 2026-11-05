"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  UploadCloud, Camera, RotateCcw, Check, Film, Globe, Users, Lock,
  Music2, Hash, ImagePlus, Trash2, FileVideo, Sparkles, ArrowLeft, LogIn, Play,
} from "lucide-react";
import { useApp } from "@/components/providers";
import { Spinner, EmptyState } from "@/components/ui";
import { api, post, uploadFile } from "@/lib/client";
import { CATEGORY_LIST, timeAgo } from "@/lib/format";
import type { DraftDTO, VideoDTO } from "@/lib/types";

const VIDEO_TYPES = ["mp4", "webm", "mov", "m4v"];
const MAX_BYTES = 150 * 1024 * 1024;

type Step = "source" | "details" | "success";
type Meta = { duration: number; width: number; height: number };

async function probeVideo(url: string): Promise<{ meta: Meta; frames: string[] }> {
  const v = document.createElement("video");
  v.src = url;
  v.muted = true;
  v.playsInline = true;
  v.preload = "auto";
  await new Promise<void>((res, rej) => {
    v.onloadeddata = () => res();
    v.onerror = () => rej(new Error("This file can't be previewed in your browser."));
    setTimeout(() => rej(new Error("Timed out reading the video.")), 15000);
  });
  // MediaRecorder webm files report Infinity duration until forced to seek.
  if (!isFinite(v.duration)) {
    await new Promise<void>((res) => {
      const done = () => res();
      v.ontimeupdate = done;
      setTimeout(done, 2500);
      v.currentTime = 1e7;
    });
    v.ontimeupdate = null;
  }
  const duration = isFinite(v.duration) ? v.duration : 0;
  const meta: Meta = { duration, width: v.videoWidth || 1080, height: v.videoHeight || 1920 };
  const canvas = document.createElement("canvas");
  const scale = Math.min(1, 540 / (v.videoWidth || 540));
  canvas.width = Math.round((v.videoWidth || 540) * scale);
  canvas.height = Math.round((v.videoHeight || 960) * scale);
  const ctx = canvas.getContext("2d");
  const frames: string[] = [];
  if (ctx && duration > 0) {
    for (const p of [0.08, 0.33, 0.6, 0.85]) {
      try {
        await new Promise<void>((res) => {
          const done = () => res();
          v.onseeked = done;
          setTimeout(done, 1800);
          v.currentTime = duration * p;
        });
        ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
        frames.push(canvas.toDataURL("image/jpeg", 0.82));
      } catch { /* skip frame */ }
    }
  }
  v.onseeked = null;
  v.src = "";
  return { meta, frames };
}

export function CreateView() {
  const { user, ready, toast } = useApp();
  const [step, setStep] = useState<Step>("source");
  const [sourceMode, setSourceMode] = useState<"upload" | "camera">("upload");
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [meta, setMeta] = useState<Meta | null>(null);
  const [frames, setFrames] = useState<string[]>([]);
  const [coverIdx, setCoverIdx] = useState(0);
  const [customCover, setCustomCover] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [caption, setCaption] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [sound, setSound] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [phase, setPhase] = useState<"idle" | "uploading" | "finishing">("idle");
  const [progress, setProgress] = useState(0);
  const [published, setPublished] = useState<VideoDTO | null>(null);
  const [drafts, setDrafts] = useState<DraftDTO[]>([]);
  const [resumedDraft, setResumedDraft] = useState<string | null>(null);
  const [camState, setCamState] = useState<"off" | "starting" | "live" | "recording" | "error">("off");
  const [camError, setCamError] = useState("");
  const [recSecs, setRecSecs] = useState(0);
  const fileInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const camVideo = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDrafts = useCallback(() => {
    api<{ drafts: DraftDTO[] }>("/api/videos/mine").then((d) => setDrafts(d.drafts)).catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      loadDrafts();
      setSound(`Original sound — ${user.username}`);
    }
  }, [user, loadDrafts]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (recTimer.current) clearInterval(recTimer.current);
    setCamState("off");
    setRecSecs(0);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);
  useEffect(() => () => { if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const acceptFile = useCallback(async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!VIDEO_TYPES.includes(ext) && !f.type.startsWith("video/")) {
      toast("Unsupported format — use MP4, WebM or MOV.", "error");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast("File is too large (max 150 MB).", "error");
      return;
    }
    setAnalyzing(true);
    setFile(f);
    setResumedDraft(null);
    setCustomCover(null);
    setCoverIdx(0);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    try {
      const { meta: m, frames: fr } = await probeVideo(url);
      if (m.duration > 600) {
        toast("Videos are limited to 10 minutes.", "error");
        setFile(null);
        setPreviewUrl(null);
        return;
      }
      setMeta(m);
      setFrames(fr);
      setStep("details");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't read that video", "error");
      setFile(null);
      setPreviewUrl(null);
    } finally {
      setAnalyzing(false);
    }
  }, [toast]);

  const startCamera = async () => {
    setCamState("starting");
    setCamError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1080 }, height: { ideal: 1920 } },
        audio: true,
      });
      streamRef.current = stream;
      setCamState("live");
      setTimeout(() => {
        if (camVideo.current) {
          camVideo.current.srcObject = stream;
          void camVideo.current.play().catch(() => {});
        }
      }, 60);
    } catch {
      setCamState("error");
      setCamError("Camera access was denied or no camera is available. You can still upload a video from your device.");
    }
  };

  const startRecording = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = ["video/webm;codecs=vp9,opus", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m)) ?? "";
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    chunksRef.current = [];
    rec.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
    rec.onstop = () => {
      const type = rec.mimeType || "video/webm";
      const blob = new Blob(chunksRef.current, { type });
      const ext = type.includes("mp4") ? "mp4" : "webm";
      const f = new File([blob], `vado-recording.${ext}`, { type });
      stopCamera();
      void acceptFile(f);
    };
    recorderRef.current = rec;
    rec.start(250);
    setCamState("recording");
    setRecSecs(0);
    recTimer.current = setInterval(() => {
      setRecSecs((s) => {
        if (s >= 59) recorderRef.current?.stop();
        return s + 1;
      });
    }, 1000);
  };

  const resumeDraft = async (d: DraftDTO) => {
    setResumedDraft(d.id);
    setCaption(d.caption);
    setVisibility(d.visibility);
    setSound(d.soundTitle);
    setPreviewUrl(d.videoUrl);
    setFile(null);
    setFrames([]);
    setCustomCover(d.thumbnailUrl);
    setAnalyzing(true);
    try {
      const { meta: m } = await probeVideo(d.videoUrl);
      setMeta(m);
      setStep("details");
    } catch {
      setMeta({ duration: d.durationMs / 1000, width: 1080, height: 1920 });
      setStep("details");
    } finally {
      setAnalyzing(false);
    }
  };

  const deleteDraft = async (id: string) => {
    try {
      await api(`/api/videos/${id}`, { method: "DELETE" });
      setDrafts((p) => p.filter((x) => x.id !== id));
      toast("Draft deleted", "success");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Couldn't delete draft", "error");
    }
  };

  const reset = () => {
    setStep("source");
    setFile(null);
    setPreviewUrl(null);
    setMeta(null);
    setFrames([]);
    setCustomCover(null);
    setCaption("");
    setCategorySlug("");
    setVisibility("public");
    setResumedDraft(null);
    setPhase("idle");
    setProgress(0);
    setPublished(null);
    if (user) setSound(`Original sound — ${user.username}`);
    loadDrafts();
  };

  const publish = async (asDraft: boolean) => {
    if (!user) return;
    setPhase("uploading");
    setProgress(0);
    try {
      let videoId: string | null = resumedDraft;
      if (resumedDraft) {
        // Draft already holds the media — just update metadata / status.
        const r = await api<{ video: VideoDTO }>(`/api/videos/${resumedDraft}`, {
          method: "PATCH",
          body: JSON.stringify({ caption, visibility, soundTitle: sound, categorySlug, ...(asDraft ? {} : { status: "published" }) }),
        });
        videoId = r.video?.id ?? resumedDraft;
        if (asDraft) {
          toast("Draft updated", "success");
          reset();
          return;
        }
        setPublished(r.video);
        setStep("success");
        return;
      }
      if (!file) throw new Error("Pick a video first.");
      const up = await uploadFile(file, "video", setProgress, file.name);
      setPhase("finishing");
      let thumbnailKey = up.thumbnailKey;
      const coverData = customCover && customCover.startsWith("data:") ? customCover : frames[coverIdx];
      if (coverData && coverData.startsWith("data:")) {
        try {
          const blob = await (await fetch(coverData)).blob();
          const cov = await uploadFile(blob, "cover", () => {}, "cover.jpg");
          thumbnailKey = cov.key;
        } catch { /* server thumbnail fallback */ }
      }
      const r = await post<{ video: VideoDTO }>("/api/videos", {
        videoKey: up.key,
        thumbnailKey,
        caption,
        visibility,
        status: asDraft ? "draft" : "published",
        soundTitle: sound,
        categorySlug,
        durationMs: Math.round((meta?.duration ?? 0) * 1000),
        width: meta?.width ?? 1080,
        height: meta?.height ?? 1920,
        sizeBytes: file.size,
      });
      if (asDraft) {
        toast("Saved to drafts", "success");
        reset();
      } else {
        setPublished(r.video);
        setStep("success");
      }
    } catch (e) {
      toast(e instanceof Error ? e.message : "Publishing failed", "error");
      setPhase("idle");
    }
  };

  if (!ready) {
    return <div className="min-h-dvh flex items-center justify-center"><Spinner /></div>;
  }
  if (!user) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-6 pb-24">
        <EmptyState
          icon={Film}
          title="Create on VADO"
          sub="Sign in to record, upload and publish your own short videos — drafts included."
          action={
            <Link href="/auth?next=%2Fcreate" className="btn-primary rounded-xl px-6 py-3 text-sm font-bold text-white flex items-center gap-2">
              <LogIn size={15} /> Sign in to create
            </Link>
          }
        />
      </div>
    );
  }

  const hashtagCount = (caption.match(/#[\p{L}\p{N}_]+/gu) || []).length;
  const busy = phase !== "idle";

  return (
    <div className="max-w-5xl mx-auto px-4 pt-6 pb-28 lg:pb-12">
      <div className="flex items-center gap-3 mb-6">
        {step === "details" && (
          <button onClick={reset} disabled={busy} className="glass-soft w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 transition" aria-label="Back">
            <ArrowLeft size={16} />
          </button>
        )}
        <h1 className="text-2xl font-extrabold">
          {step === "source" && <>Create <span className="text-grad">something</span></>}
          {step === "details" && (resumedDraft ? "Finish your draft" : "Final touches")}
          {step === "success" && "Published 🎉"}
        </h1>
      </div>

      <AnimatePresence mode="wait">
        {step === "source" && (
          <motion.div key="source" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
            <div className="glass-soft rounded-2xl p-1 flex w-fit mb-5">
              {(["upload", "camera"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => { setSourceMode(m); if (m !== "camera") stopCamera(); }}
                  className={`relative px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition ${sourceMode === m ? "text-white" : "text-vado-sub"}`}
                >
                  {sourceMode === m && (
                    <motion.span layoutId="create-mode" className="absolute inset-0 rounded-xl bg-gradient-to-r from-vado-blue/70 to-vado-purple/70" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                  )}
                  <span className="relative flex items-center gap-2">
                    {m === "upload" ? <UploadCloud size={16} /> : <Camera size={16} />}
                    {m === "upload" ? "Upload" : "Record"}
                  </span>
                </button>
              ))}
            </div>

            {sourceMode === "upload" ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragging(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) void acceptFile(f);
                }}
                className={`glass rounded-[2rem] border-2 border-dashed px-8 py-16 flex flex-col items-center text-center transition-all ${
                  dragging ? "border-vado-cyan bg-vado-blue/10 scale-[1.01]" : "border-white/15"
                }`}
              >
                {analyzing ? (
                  <>
                    <Spinner size={36} />
                    <p className="font-bold mt-5">Reading your video…</p>
                    <p className="text-sm text-vado-sub mt-1">Extracting cover frames</p>
                  </>
                ) : (
                  <>
                    <motion.span
                      animate={{ y: [0, -8, 0] }}
                      transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                      className="w-20 h-20 rounded-3xl bg-gradient-to-br from-vado-blue/30 to-vado-purple/30 border border-white/15 flex items-center justify-center"
                    >
                      <UploadCloud size={34} className="text-vado-cyan" />
                    </motion.span>
                    <p className="font-extrabold text-xl mt-6">Drop your video here</p>
                    <p className="text-sm text-vado-sub mt-2 max-w-sm">MP4, WebM or MOV · up to 150 MB · up to 10 minutes. Vertical 9:16 looks best.</p>
                    <button onClick={() => fileInput.current?.click()} className="btn-primary rounded-2xl px-7 py-3 font-bold text-white mt-6">
                      Choose from device
                    </button>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void acceptFile(f);
                        e.target.value = "";
                      }}
                    />
                  </>
                )}
              </div>
            ) : (
              <div className="glass rounded-[2rem] p-6 flex flex-col items-center">
                <div className="relative w-full max-w-xs aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-white/12">
                  <video ref={camVideo} muted playsInline className="absolute inset-0 w-full h-full object-cover" />
                  {camState === "off" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                      <Camera size={38} className="text-vado-cyan" />
                      <p className="text-sm text-vado-sub">Record up to 60 seconds straight from your camera.</p>
                      <button onClick={() => void startCamera()} className="btn-primary rounded-xl px-5 py-2.5 text-sm font-bold text-white">Enable camera</button>
                    </div>
                  )}
                  {camState === "starting" && (
                    <div className="absolute inset-0 flex items-center justify-center"><Spinner /></div>
                  )}
                  {camState === "error" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                      <Camera size={32} className="text-vado-danger" />
                      <p className="text-xs text-vado-sub leading-relaxed">{camError}</p>
                      <button onClick={() => setSourceMode("upload")} className="glass-soft rounded-xl px-4 py-2 text-xs font-bold hover:bg-white/10 transition">Upload instead</button>
                    </div>
                  )}
                  {camState === "recording" && (
                    <span className="absolute top-3 left-3 glass-deep rounded-full px-3 py-1 text-xs font-bold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-vado-danger animate-pulse" /> 0:{String(recSecs).padStart(2, "0")}
                    </span>
                  )}
                </div>
                {(camState === "live" || camState === "recording") && (
                  <div className="flex items-center gap-4 mt-5">
                    {camState === "live" ? (
                      <button onClick={startRecording} className="w-16 h-16 rounded-full border-4 border-white/80 flex items-center justify-center hover:scale-105 transition" aria-label="Start recording">
                        <span className="w-11 h-11 rounded-full bg-vado-danger" />
                      </button>
                    ) : (
                      <button onClick={() => recorderRef.current?.stop()} className="w-16 h-16 rounded-full border-4 border-vado-danger flex items-center justify-center rec-ring" aria-label="Stop recording">
                        <span className="w-8 h-8 rounded-lg bg-vado-danger" />
                      </button>
                    )}
                    <button onClick={stopCamera} className="glass-soft rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-white/10 transition flex items-center gap-1.5">
                      <RotateCcw size={13} /> Cancel
                    </button>
                  </div>
                )}
                {camState === "recording" && <p className="text-xs text-vado-sub mt-3">Recording… tap the square to finish and preview.</p>}
              </div>
            )}

            {/* Drafts */}
            {drafts.length > 0 && (
              <section className="mt-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-vado-sub mb-3 flex items-center gap-2">
                  <FileVideo size={15} /> Your drafts ({drafts.length})
                </h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {drafts.map((d) => (
                    <div key={d.id} className="glass rounded-2xl p-3 flex items-center gap-3">
                      <div className="w-14 h-20 rounded-xl overflow-hidden bg-vado-bg2 shrink-0">
                        {d.thumbnailUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={d.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <video src={d.videoUrl} muted playsInline preload="metadata" className="w-full h-full object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{d.caption || "Untitled draft"}</p>
                        <p className="text-[11px] text-vado-sub mt-0.5">Edited {timeAgo(d.updatedAt)}</p>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => void resumeDraft(d)} className="btn-primary rounded-lg px-3 py-1.5 text-[11px] font-bold text-white">Resume</button>
                          <button onClick={() => void deleteDraft(d.id)} className="glass-soft rounded-lg px-2.5 py-1.5 text-vado-sub hover:text-vado-danger transition" aria-label="Delete draft">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </motion.div>
        )}

        {step === "details" && (
          <motion.div key="details" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="grid lg:grid-cols-[300px_1fr] gap-6">
            {/* Preview + covers */}
            <div>
              <div className="relative aspect-[9/16] rounded-3xl overflow-hidden bg-black border border-white/12">
                {previewUrl && <video src={previewUrl} controls loop playsInline muted className="absolute inset-0 w-full h-full object-cover" />}
                <span className="absolute top-2.5 left-2.5 glass-deep rounded-full px-2.5 py-1 text-[10px] font-bold pointer-events-none">
                  {meta ? `${Math.round(meta.duration)}s · ${meta.width}×${meta.height}` : "Preview"}
                </span>
              </div>
              {!resumedDraft && frames.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-vado-sub mb-2 flex items-center gap-1.5"><ImagePlus size={13} /> Cover frame</p>
                  <div className="grid grid-cols-5 gap-2">
                    {frames.map((f, i) => (
                      <button
                        key={i}
                        onClick={() => { setCoverIdx(i); setCustomCover(null); }}
                        className={`relative aspect-[9/14] rounded-lg overflow-hidden border-2 transition ${coverIdx === i && !customCover ? "border-vado-cyan shadow-[0_0_12px_rgba(56,201,255,0.5)]" : "border-transparent opacity-70 hover:opacity-100"}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f} alt={`Frame ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    <button
                      onClick={() => coverInput.current?.click()}
                      className={`relative aspect-[9/14] rounded-lg overflow-hidden border-2 border-dashed flex items-center justify-center transition ${customCover ? "border-vado-cyan" : "border-white/20 hover:border-white/40"}`}
                      aria-label="Upload custom cover"
                    >
                      {customCover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={customCover} alt="Custom cover" className="w-full h-full object-cover" />
                      ) : (
                        <ImagePlus size={15} className="text-vado-sub" />
                      )}
                    </button>
                    <input
                      ref={coverInput}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          if (f.size > 8 * 1024 * 1024) return toast("Cover image max 8 MB", "error");
                          const r = new FileReader();
                          r.onload = () => setCustomCover(String(r.result));
                          r.readAsDataURL(f);
                        }
                        e.target.value = "";
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Metadata form */}
            <div className="glass rounded-[2rem] p-6 flex flex-col gap-5">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-vado-sub">Caption</span>
                  <span className="text-[11px] text-vado-sub">{caption.length}/2200 · <Hash size={10} className="inline" /> {hashtagCount}</span>
                </div>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  maxLength={2200}
                  rows={3}
                  placeholder="Say something… add #hashtags so people can find it"
                  className="glass-input w-full rounded-2xl px-4 py-3 text-sm placeholder:text-vado-sub/50 resize-none"
                />
                {hashtagCount > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {[...new Set((caption.match(/#[\p{L}\p{N}_]+/gu) || []).map((t) => t.toLowerCase()))].slice(0, 8).map((t) => (
                      <span key={t} className="text-[11px] font-bold text-vado-cyan bg-vado-cyan/10 rounded-full px-2.5 py-1">{t}</span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-vado-sub block mb-2">Category</span>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_LIST.map((c) => (
                    <button
                      key={c.slug}
                      onClick={() => setCategorySlug(categorySlug === c.slug ? "" : c.slug)}
                      className={`rounded-full px-3.5 py-2 text-xs font-bold border transition ${categorySlug === c.slug ? "text-white border-transparent" : "glass-soft border-transparent text-vado-sub hover:text-vado-text"}`}
                      style={categorySlug === c.slug ? { background: `linear-gradient(94deg, ${c.hue}cc, ${c.hue}77)` } : undefined}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-vado-sub block mb-1.5 flex items-center gap-1.5"><Music2 size={12} /> Sound title</span>
                <input
                  value={sound}
                  onChange={(e) => setSound(e.target.value)}
                  maxLength={80}
                  className="glass-input w-full rounded-xl px-4 py-2.5 text-sm"
                  placeholder="Original sound"
                />
              </div>

              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-vado-sub block mb-2">Who can watch</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: "public", label: "Everyone", icon: Globe, desc: "On For You" },
                    { v: "followers", label: "Followers", icon: Users, desc: "Approved only" },
                    { v: "private", label: "Only me", icon: Lock, desc: "Hidden" },
                  ].map((o) => (
                    <button
                      key={o.v}
                      onClick={() => setVisibility(o.v)}
                      className={`rounded-2xl px-3 py-3 text-left border transition ${visibility === o.v ? "bg-vado-blue/15 border-vado-blue/50" : "glass-soft border-transparent hover:bg-white/8"}`}
                    >
                      <o.icon size={16} className={visibility === o.v ? "text-vado-cyan" : "text-vado-sub"} />
                      <span className="block text-xs font-bold mt-1.5">{o.label}</span>
                      <span className="block text-[10px] text-vado-sub">{o.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {busy && (
                <div className="glass-soft rounded-2xl p-4">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="flex items-center gap-2">
                      <Sparkles size={13} className="text-vado-cyan" />
                      {phase === "uploading" ? "Uploading your video…" : "Processing & publishing…"}
                    </span>
                    <span className="text-vado-cyan">{phase === "uploading" ? `${progress}%` : "…"}</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-vado-cyan via-vado-blue to-vado-purple"
                      animate={{ width: phase === "uploading" ? `${progress}%` : "100%" }}
                      transition={{ ease: "easeOut", duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-auto">
                <button onClick={() => void publish(true)} disabled={busy} className="glass-soft rounded-2xl px-5 py-3 font-bold text-sm hover:bg-white/10 transition flex-1">
                  Save draft
                </button>
                <button onClick={() => void publish(false)} disabled={busy} className="btn-primary rounded-2xl px-5 py-3 font-bold text-sm text-white flex-[2] flex items-center justify-center gap-2">
                  <Play size={15} fill="white" /> {resumedDraft ? "Publish draft" : "Publish now"}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "success" && published && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass rounded-[2rem] px-8 py-14 max-w-lg mx-auto text-center relative overflow-hidden">
            <div className="absolute -top-20 left-1/4 w-60 h-60 rounded-full bg-vado-blue/25 blur-3xl" />
            <div className="absolute -bottom-20 right-1/4 w-60 h-60 rounded-full bg-vado-purple/25 blur-3xl" />
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.15 }}
              className="relative mx-auto w-20 h-20 rounded-full bg-vado-success/20 border border-vado-success/40 flex items-center justify-center"
            >
              <Check size={36} className="text-vado-success" />
            </motion.span>
            <h2 className="relative text-2xl font-extrabold mt-6">Your video is live!</h2>
            <p className="relative text-sm text-vado-sub mt-2 line-clamp-2">{published.caption || "Fresh on the feed."}</p>
            <div className="relative flex gap-3 justify-center mt-8">
              <Link href={`/video/${published.id}`} className="btn-primary rounded-2xl px-6 py-3 font-bold text-white text-sm">Watch it</Link>
              <button onClick={reset} className="glass-soft rounded-2xl px-6 py-3 font-bold text-sm hover:bg-white/10 transition">Create another</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
