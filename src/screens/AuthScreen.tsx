import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronLeft, Eye, EyeOff } from 'lucide-react';
import { VadoEmblem } from '../components/VadoEmblem';
import { useToast } from '../components/Toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AuthScreen({ onSignedIn, onBack }: { onSignedIn: (name: string) => void; onBack: () => void }) {
  const reduce = useReducedMotion();
  const toast = useToast();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!EMAIL_RE.test(email)) next.email = 'Enter a valid email address.';
    if (password.length < 8) next.password = 'Password must be at least 8 characters.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      localStorage.setItem('vado.session', JSON.stringify({ name: email.split('@')[0] }));
      toast(mode === 'login' ? 'Welcome back — you’re signed in' : 'Account created — welcome to VADO');
      onSignedIn(email.split('@')[0]);
    }, 900);
  };

  const social = (provider: string) => {
    setBusy(true);
    window.setTimeout(() => {
      setBusy(false);
      localStorage.setItem('vado.session', JSON.stringify({ name: `${provider} vador` }));
      toast(`Signed in with ${provider} (demo)`);
      onSignedIn(`${provider} vador`);
    }, 700);
  };

  const rise = (d: number) => ({
    initial: reduce ? { opacity: 0 } : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: reduce ? 0 : d, duration: 0.35 },
  });

  return (
    <div className="scroll-slim flex h-full flex-col overflow-y-auto px-6 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-0.5 text-[13px] text-mist transition-colors hover:text-ink"
      >
        <ChevronLeft size={16} /> Back to Vibes
      </button>

      <div className="mt-3 flex flex-col items-center text-center">
        <motion.div {...rise(0.05)}>
          <VadoEmblem size={84} breathe />
        </motion.div>
        <motion.p {...rise(0.12)} className="mt-1 text-[11px] font-bold tracking-[0.4em] text-ink">
          VADO
        </motion.p>
        <motion.h2 {...rise(0.18)} className="mt-4 text-[26px] font-semibold text-ink">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </motion.h2>
        <motion.p {...rise(0.24)} className="text-[13px] text-mist">
          {mode === 'login'
            ? 'Log in to continue to your creative world'
            : 'Start your creative world in seconds'}
        </motion.p>
      </div>

      <motion.form {...rise(0.3)} onSubmit={submit} noValidate className="mt-6 flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-left">
          <span className="text-[12px] font-medium text-mist">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className={`w-full rounded-full border bg-volt/10 px-4 py-3 text-sm text-ink placeholder:text-mist/60 outline-none transition-all focus:border-beam/80 focus:shadow-glow ${
              errors.email ? 'border-red-400/80' : 'border-[#d8f3ff]/35'
            }`}
          />
          {errors.email && <span role="alert" className="pl-4 text-[11px] text-red-300">{errors.email}</span>}
        </label>
        <label className="flex flex-col gap-1.5 text-left">
          <span className="text-[12px] font-medium text-mist">Password</span>
          <span className="relative block">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              aria-invalid={!!errors.password}
              className={`w-full rounded-full border bg-volt/10 py-3 pl-4 pr-11 text-sm text-ink placeholder:text-mist/60 outline-none transition-all focus:border-beam/80 focus:shadow-glow ${
                errors.password ? 'border-red-400/80' : 'border-[#d8f3ff]/35'
              }`}
            />
            <button
              type="button"
              aria-label={show ? 'Hide password' : 'Show password'}
              onClick={() => setShow((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-mist transition-colors hover:text-ink"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </span>
          {errors.password && <span role="alert" className="pl-4 text-[11px] text-red-300">{errors.password}</span>}
        </label>

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => toast('Reset link sent (demo)')}
            className="self-end pr-1 text-[12px] text-mist underline-offset-2 hover:text-beam hover:underline"
          >
            Forgot password?
          </button>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-volt to-beam py-3 text-[16px] font-semibold text-white shadow-glow transition-all hover:brightness-110 disabled:opacity-60"
        >
          {busy && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {mode === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      </motion.form>

      <motion.div {...rise(0.4)} className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-mist">
        <span className="h-px flex-1 bg-[#d8f3ff]/20" /> or <span className="h-px flex-1 bg-[#d8f3ff]/20" />
      </motion.div>

      <motion.div {...rise(0.45)} className="flex justify-center gap-4">
        <SocialButton label="Google" onClick={() => social('Google')}>
          <span className="text-[16px] font-bold">G</span>
        </SocialButton>
        <SocialButton label="Apple" onClick={() => social('Apple')}>
          <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor" aria-hidden="true">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
        </SocialButton>
        <SocialButton label="Facebook" onClick={() => social('Facebook')}>
          <span className="text-[17px] font-bold">f</span>
        </SocialButton>
      </motion.div>

      <p className="pb-6 pt-5 text-center text-[13px] text-mist">
        {mode === 'login' ? 'Don’t have an account?' : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(mode === 'login' ? 'signup' : 'login');
            setErrors({});
          }}
          className="font-semibold text-beam underline-offset-2 hover:underline"
        >
          {mode === 'login' ? 'Sign Up' : 'Sign In'}
        </button>
      </p>
    </div>
  );
}

function SocialButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={`Continue with ${label}`}
      onClick={onClick}
      className="flex h-12 w-12 items-center justify-center rounded-full border border-[#d8f3ff]/40 bg-glass text-ink backdrop-blur-lg transition-all hover:border-beam hover:shadow-glow"
    >
      {children}
    </button>
  );
}
