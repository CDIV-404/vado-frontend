"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, ShieldCheck } from "lucide-react";
import { Atmosphere } from "@/components/shell";
import { Logo, Spinner, Field, inputCls } from "@/components/ui";
import { useApp } from "@/components/providers";
import { post } from "@/lib/client";

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const { toast } = useApp();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (password !== confirm) return setError("Passwords don't match.");
    setBusy(true);
    try {
      await post("/api/auth/reset", { token: params.get("token") || "", password });
      setDone(true);
      toast("Password updated — sign in with your new password", "success");
      setTimeout(() => router.push("/auth"), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="glass-deep rounded-[2rem] w-full max-w-md p-10">
      <div className="flex justify-center mb-6"><Logo size={36} /></div>
      {done ? (
        <div className="text-center">
          <span className="mx-auto w-16 h-16 rounded-full bg-vado-success/15 flex items-center justify-center mb-4">
            <ShieldCheck size={28} className="text-vado-success" />
          </span>
          <h1 className="text-xl font-extrabold">Password updated</h1>
          <p className="text-sm text-vado-sub mt-2">All sessions were signed out for safety. Redirecting to sign in…</p>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); void submit(); }}>
          <span className="mx-auto w-14 h-14 rounded-full bg-vado-cyan/15 flex items-center justify-center">
            <KeyRound size={24} className="text-vado-cyan" />
          </span>
          <h1 className="text-xl font-extrabold text-center">Choose a new password</h1>
          {error && <p className="bg-vado-danger/12 border border-vado-danger/35 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-vado-danger">{error}</p>}
          <Field label="New password" hint="At least 8 characters">
            <input className={inputCls} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Confirm password">
            <input className={inputCls} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          </Field>
          <button type="submit" disabled={busy || !password} className="btn-primary rounded-2xl py-3 font-bold text-white">
            {busy ? "Updating…" : "Update password"}
          </button>
          <Link href="/auth" className="text-xs font-semibold text-vado-cyan hover:underline text-center">← Back to sign in</Link>
        </form>
      )}
    </motion.div>
  );
}

export default function ResetPage() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative">
      <Atmosphere />
      <Suspense fallback={<Spinner />}>
        <ResetInner />
      </Suspense>
    </div>
  );
}
