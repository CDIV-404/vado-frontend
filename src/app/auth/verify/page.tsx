"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { MailCheck, MailX } from "lucide-react";
import { Atmosphere } from "@/components/shell";
import { Logo, Spinner } from "@/components/ui";
import { useApp } from "@/components/providers";
import { post } from "@/lib/client";

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get("token") || "";
  const { refresh } = useApp();
  const [state, setState] = useState<"working" | "ok" | "fail">("working");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    post("/api/auth/verify", { token })
      .then(() => {
        setState("ok");
        void refresh();
      })
      .catch((e) => {
        setState("fail");
        setMessage(e instanceof Error ? e.message : "Verification failed");
      });
  }, [token, refresh]);

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass-deep rounded-[2rem] w-full max-w-md p-10 text-center">
      <div className="flex justify-center mb-6"><Logo size={36} /></div>
      {state === "working" ? (
        <div className="flex flex-col items-center gap-4 py-6"><Spinner /><p className="text-sm text-vado-sub">Verifying your email…</p></div>
      ) : state === "ok" ? (
        <>
          <span className="mx-auto w-16 h-16 rounded-full bg-vado-success/15 flex items-center justify-center mb-4">
            <MailCheck size={28} className="text-vado-success" />
          </span>
          <h1 className="text-2xl font-extrabold">Email verified ✓</h1>
          <p className="text-sm text-vado-sub mt-2">Your account is fully secured. Welcome to the glass dimension.</p>
          <Link href="/feed" className="btn-primary rounded-2xl px-6 py-3 font-bold text-white inline-block mt-6">Dive into the feed</Link>
        </>
      ) : (
        <>
          <span className="mx-auto w-16 h-16 rounded-full bg-vado-danger/15 flex items-center justify-center mb-4">
            <MailX size={28} className="text-vado-danger" />
          </span>
          <h1 className="text-xl font-extrabold">Link didn&apos;t work</h1>
          <p className="text-sm text-vado-sub mt-2">{message}</p>
          <Link href="/feed" className="glass-soft rounded-2xl px-6 py-3 font-bold inline-block mt-6 hover:bg-white/10 transition">Continue to VADO</Link>
        </>
      )}
    </motion.div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative">
      <Atmosphere />
      <Suspense fallback={<Spinner />}>
        <VerifyInner />
      </Suspense>
    </div>
  );
}
