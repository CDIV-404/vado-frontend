"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Eye, EyeOff, MailCheck, KeyRound, PartyPopper, Zap, AlertCircle } from "lucide-react";
import { Atmosphere } from "@/components/shell";
import { Logo, inputCls, Field } from "@/components/ui";
import { useApp } from "@/components/providers";
import { post } from "@/lib/client";
import { CATEGORY_LIST } from "@/lib/format";
import type { MeUser } from "@/lib/types";

type Mode = "login" | "register" | "recover";

export function AuthView() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/feed";
  const { setUser, refresh, toast } = useApp();
  const [mode, setMode] = useState<Mode>(params.get("mode") === "register" ? "register" : "login");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [registered, setRegistered] = useState<{ user: MeUser; devVerifyUrl: string | null } | null>(null);
  const [recoverSent, setRecoverSent] = useState<{ devResetUrl: string | null } | null>(null);

  const strength = Math.min(4, (password.length >= 8 ? 1 : 0) + (password.length >= 12 ? 1 : 0) + (/[A-Z]/.test(password) && /[a-z]/.test(password) ? 1 : 0) + (/\d|\W/.test(password) ? 1 : 0));

  const doLogin = async (id: string, pw: string) => {
    setBusy(true);
    setError(null);
    try {
      const data = await post<{ user: MeUser }>("/api/auth/login", { identifier: id, password: pw });
      setUser(data.user);
      void refresh();
      toast(`Welcome back, ${data.user.displayName} 👋`, "success");
      router.push(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setBusy(false);
    }
  };

  const doRegister = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await post<{ user: MeUser; devVerifyUrl: string | null }>("/api/auth/register", {
        email, username, displayName, password, interests,
      });
      setUser(data.user);
      void refresh();
      setRegistered(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  };

  const doRecover = async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await post<{ devResetUrl: string | null }>("/api/auth/recover", { email });
      setRecoverSent(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't send recovery email");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10 relative">
      <Atmosphere />
      <div className="pointer-events-none absolute top-10 -left-24 w-96 h-96 aurora-blob bg-vado-blue/25" />
      <div className="pointer-events-none absolute bottom-10 -right-24 w-96 h-96 aurora-blob bg-vado-purple/25" style={{ animationDelay: "-8s" }} />

      <Link href="/" className="fixed top-5 left-5 glass-soft rounded-full px-4 py-2 text-xs font-bold flex items-center gap-2 hover:bg-white/10 transition z-10">
        <ArrowLeft size={13} /> Back to VADO
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass-deep rounded-[2rem] w-full max-w-md p-8 relative"
      >
        <div className="flex justify-center mb-6"><Logo size={38} /></div>

        {registered ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <span className="mx-auto w-16 h-16 rounded-full bg-vado-success/15 flex items-center justify-center mb-4">
              <PartyPopper size={28} className="text-vado-success" />
            </span>
            <h2 className="text-2xl font-extrabold">You&apos;re in, {registered.user.displayName}!</h2>
            <p className="text-sm text-vado-sub mt-2">@{registered.user.username} is officially yours.</p>
            {registered.devVerifyUrl && (
              <div className="glass-soft rounded-2xl p-4 mt-5 text-left">
                <p className="text-xs text-vado-sub flex items-center gap-1.5 mb-2.5">
                  <MailCheck size={13} className="text-vado-cyan" />
                  Email delivery isn&apos;t configured in this environment — verify instantly:
                </p>
                <Link href={registered.devVerifyUrl} className="btn-primary rounded-xl px-4 py-2 text-xs font-bold text-white inline-block">
                  Verify my email
                </Link>
              </div>
            )}
            <button onClick={() => router.push(next)} className="btn-primary w-full rounded-2xl py-3 font-bold text-white mt-6">
              Enter VADO →
            </button>
          </motion.div>
        ) : recoverSent ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <span className="mx-auto w-16 h-16 rounded-full bg-vado-cyan/15 flex items-center justify-center mb-4">
              <KeyRound size={26} className="text-vado-cyan" />
            </span>
            <h2 className="text-xl font-extrabold">Check your inbox</h2>
            <p className="text-sm text-vado-sub mt-2">If an account exists for <b className="text-vado-text">{email}</b>, a reset link is on its way. It expires in 30 minutes.</p>
            {recoverSent.devResetUrl && (
              <div className="glass-soft rounded-2xl p-4 mt-5 text-left">
                <p className="text-xs text-vado-sub mb-2.5">Dev outbox — email delivery isn&apos;t configured here:</p>
                <Link href={recoverSent.devResetUrl} className="btn-primary rounded-xl px-4 py-2 text-xs font-bold text-white inline-block">
                  Open reset link
                </Link>
              </div>
            )}
            <button onClick={() => { setRecoverSent(null); setMode("login"); }} className="glass-soft w-full rounded-2xl py-3 font-bold mt-6 hover:bg-white/10 transition">
              Back to sign in
            </button>
          </motion.div>
        ) : (
          <>
            {mode !== "recover" && (
              <div className="glass-soft rounded-2xl p-1 flex mb-6">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setError(null); }}
                    className={`relative flex-1 py-2.5 rounded-xl text-sm font-bold transition ${mode === m ? "text-white" : "text-vado-sub"}`}
                  >
                    {mode === m && (
                      <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl bg-gradient-to-r from-vado-blue/70 to-vado-purple/70" transition={{ type: "spring", stiffness: 400, damping: 32 }} />
                    )}
                    <span className="relative">{m === "login" ? "Sign in" : "Create account"}</span>
                  </button>
                ))}
              </div>
            )}

            <AnimatePresence>
              {error && (
                <motion.div
                  key={error}
                  initial={{ opacity: 0, x: 0 }}
                  animate={{ opacity: 1, x: [0, -7, 7, -4, 4, 0] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="bg-vado-danger/12 border border-vado-danger/35 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-vado-danger mb-4 flex items-center gap-2"
                >
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            {mode === "login" && (
              <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); void doLogin(identifier, password); }}>
                <Field label="Email or username">
                  <input className={inputCls} value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="you@vado.app" autoComplete="username" />
                </Field>
                <Field label="Password">
                  <div className="relative">
                    <input className={inputCls} type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-vado-sub hover:text-vado-text" aria-label="Toggle password">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>
                <button type="button" onClick={() => { setMode("recover"); setError(null); }} className="text-xs font-semibold text-vado-cyan hover:underline text-left w-fit -mt-1">
                  Forgot password?
                </button>
                <button type="submit" disabled={busy} className="btn-primary rounded-2xl py-3 font-bold text-white">
                  {busy ? "Signing in…" : "Sign in"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void doLogin("demo@vado.app", "vadodemo123")}
                  className="glass-soft rounded-2xl py-3 font-bold text-sm hover:bg-white/10 transition flex items-center justify-center gap-2 text-vado-cyan"
                >
                  <Zap size={15} /> Explore with the demo account
                </button>
              </form>
            )}

            {mode === "register" && (
              <form className="flex flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); void doRegister(); }}>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Username">
                    <input className={inputCls} value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} placeholder="your.handle" autoComplete="off" />
                  </Field>
                  <Field label="Display name">
                    <input className={inputCls} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your Name" />
                  </Field>
                </div>
                <Field label="Email">
                  <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
                </Field>
                <Field label="Password" hint="At least 8 characters">
                  <div className="relative">
                    <input className={inputCls} type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-vado-sub hover:text-vado-text" aria-label="Toggle password">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </Field>
                {password && (
                  <div className="flex gap-1.5 -mt-1">
                    {[0, 1, 2, 3].map((i) => (
                      <span key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < strength ? (strength <= 1 ? "bg-vado-danger" : strength === 2 ? "bg-vado-warn" : "bg-vado-success") : "bg-white/10"}`} />
                    ))}
                  </div>
                )}
                <div>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-vado-sub mb-2">Tune your For You (optional)</span>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_LIST.map((c) => (
                      <button
                        type="button"
                        key={c.slug}
                        onClick={() => setInterests((p) => (p.includes(c.slug) ? p.filter((x) => x !== c.slug) : [...p, c.slug]))}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-bold border transition ${
                          interests.includes(c.slug) ? "text-white border-transparent" : "glass-soft border-transparent text-vado-sub hover:text-vado-text"
                        }`}
                        style={interests.includes(c.slug) ? { background: `linear-gradient(94deg, ${c.hue}cc, ${c.hue}88)` } : undefined}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={busy} className="btn-primary rounded-2xl py-3 font-bold text-white mt-1">
                  {busy ? "Creating your universe…" : "Create account"}
                </button>
              </form>
            )}

            {mode === "recover" && (
              <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); void doRecover(); }}>
                <h2 className="text-xl font-extrabold text-center">Reset your password</h2>
                <p className="text-xs text-vado-sub text-center -mt-2">Enter your account email and we&apos;ll send a reset link.</p>
                <Field label="Email">
                  <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                </Field>
                <button type="submit" disabled={busy} className="btn-primary rounded-2xl py-3 font-bold text-white">
                  {busy ? "Sending…" : "Send reset link"}
                </button>
                <button type="button" onClick={() => { setMode("login"); setError(null); }} className="text-xs font-semibold text-vado-cyan hover:underline">
                  ← Back to sign in
                </button>
              </form>
            )}

            <p className="text-[11px] text-vado-sub/60 text-center mt-6 leading-relaxed">
              By continuing you agree to keep VADO kind. Guests can always{" "}
              <Link href="/feed" className="text-vado-cyan hover:underline">browse without an account</Link>.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
