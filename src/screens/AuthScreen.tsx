import { useEffect, useState, type FormEvent } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { VadoEmblem } from '../components/VadoEmblem';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Account = {
  displayName: string;
  username: string;
  email: string;
  accountType: 'Personal' | 'Creator' | 'Business';
};

export function AuthScreen({
  onBack,
  action,
  onAccountCreated,
}: {
  onBack: () => void;
  action?: string;
  onAccountCreated: (account: Account) => void;
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [accountType, setAccountType] = useState<Account['accountType'] | ''>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onBack();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [onBack]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!EMAIL_RE.test(email) || password.length < 8) {
      setMessage('Enter a valid email address and a password with at least 8 characters.');
      return;
    }
    if (mode === 'login') {
      setMessage('Sign-in is not connected yet. Create an account to unlock the app on this browser.');
      return;
    }
    if (!displayName.trim() || !/^[a-zA-Z0-9_]{3,24}$/.test(username)) {
      setMessage('Enter a display name and a username (3–24 letters, numbers or underscores).');
      return;
    }
    if (!accountType) {
      setMessage('Select an account type to continue.');
      return;
    }
    if (password !== confirmPassword) {
      setMessage('Your passwords do not match.');
      return;
    }

    const account: Account = {
      displayName: displayName.trim(),
      username,
      email: email.trim(),
      accountType,
    };
    try {
      localStorage.setItem('vado.account', JSON.stringify(account));
      onAccountCreated(account);
    } catch (error) {
      setMessage(error instanceof Error
        ? `Could not save your account on this browser: ${error.message}`
        : 'Could not save your account in this browser.');
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setMessage('');
  };

  return (
    <div className="scroll-slim absolute inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#030b16]/80 p-4 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Account access">
      <div className="vado-glass-card relative my-auto w-full max-w-[460px] rounded-3xl p-6 shadow-[0_24px_100px_rgba(0,0,0,.55)] sm:p-8">
        <button type="button" onClick={onBack} aria-label="Continue browsing" className="absolute right-4 top-4 rounded-full p-2 text-[#AAB8D0] transition-colors hover:bg-white/5 hover:text-white">
          <X size={18} />
        </button>
        <div className="flex flex-col items-center text-center">
          <VadoEmblem size={58} />
          <p className="mt-2 text-[10px] font-semibold tracking-[0.3em] text-[#AAB8D0]">VADO</p>
          <h1 className="mt-4 text-2xl font-semibold text-[#F5F7FF]">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
          <p className="mt-2 max-w-sm text-sm leading-5 text-[#AAB8D0]">
            {action ? `Create an account to ${action} and unlock every section of VADO.` : 'Create an account to unlock every section of VADO.'} Your profile is saved on this browser; platform sign-in is not connected.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-2 rounded-xl border border-[#91d2ff]/20 bg-[#030b16]/45 p-1">
          {(['login', 'signup'] as const).map((value) => (
            <button type="button" key={value} onClick={() => { setMode(value); setMessage(''); }} aria-pressed={mode === value} className={`rounded-lg py-2 text-sm font-medium capitalize transition-colors ${mode === value ? 'bg-white/10 text-[#F5F7FF]' : 'text-[#AAB8D0] hover:text-white'}`}>
              {value === 'login' ? 'Log in' : 'Create account'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} noValidate className="mt-5 space-y-3">
          {mode === 'signup' && (
            <>
              <Field label="Display name">
                <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} autoComplete="name" placeholder="Your name" className={inputClass} />
              </Field>
              <Field label="Username">
                <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" placeholder="Choose a username" className={inputClass} />
              </Field>
              <Field label="Account Type">
                <select required value={accountType} onChange={(event) => {
                  const value = event.target.value;
                  setAccountType(value === 'Personal' || value === 'Creator' || value === 'Business' ? value : '');
                }} className={`${inputClass} appearance-none`}>
                  <option value="">Select account type</option>
                  <option value="Personal">Personal</option>
                  <option value="Creator">Creator</option>
                  <option value="Business">Business</option>
                </select>
              </Field>
            </>
          )}
          <Field label="Email">
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" className={inputClass} />
          </Field>
          <Field label="Password">
            <span className="relative block">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="At least 8 characters" className={`${inputClass} pr-12`} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#AAB8D0] hover:text-white">
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </span>
          </Field>
          {mode === 'login' && (
            <label className="flex items-center gap-2 text-xs text-[#AAB8D0]">
              <input type="checkbox" className="h-4 w-4 accent-[#287CFF]" />
              Remember me on this device
            </label>
          )}
          {mode === 'signup' && (
            <Field label="Confirm password">
              <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" placeholder="Re-enter your password" className={inputClass} />
            </Field>
          )}
          {mode === 'login' && (
            <button type="button" onClick={() => setMessage('Password recovery is not available until an authentication service is connected.')} className="block w-full text-right text-xs text-[#AAB8D0] hover:text-[#38C9FF]">
              Forgot password?
            </button>
          )}
          {message && <p role="alert" className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2.5 text-xs leading-5 text-amber-100">{message}</p>}
          <button type="submit" className="w-full rounded-full border border-[#67baff]/55 bg-gradient-to-r from-[#1687ff]/75 to-[#287CFF] py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(22,135,255,.28)] transition-all hover:shadow-[0_0_30px_rgba(56,201,255,.38)] active:scale-[.98]">
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
          <p className="text-center text-[11px] leading-5 text-[#AAB8D0]">
            {mode === 'signup'
              ? 'Your profile is saved on this browser only. Your password is never saved, and sign-in across devices is not available yet.'
              : 'Sign-in is unavailable until an authentication service is connected. Passwords are never saved here.'}
          </p>
        </form>

        <div className="my-4 flex items-center gap-3 text-[10px] uppercase tracking-[0.16em] text-[#AAB8D0]/70">
          <span className="h-px flex-1 bg-white/10" /> Or continue with <span className="h-px flex-1 bg-white/10" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {['Google', 'Apple'].map((provider) => (
            <button
              type="button"
              key={provider}
              onClick={() => setMessage(`${provider} sign-in is unavailable until an authentication service is connected.`)}
              className="rounded-xl border border-[#91d2ff]/20 bg-[#123758]/30 px-4 py-2.5 text-xs font-medium text-[#F5F7FF] transition-colors hover:border-[#38C9FF]/45 hover:bg-[#123758]/50"
            >
              Continue with {provider}
            </button>
          ))}
        </div>

        <p className="mt-5 text-center text-sm text-[#AAB8D0]">
          {mode === 'login' ? 'New to VADO?' : 'Already have an account?'}{' '}
          <button type="button" onClick={switchMode} className="font-semibold text-[#38C9FF] hover:underline">
            {mode === 'login' ? 'Create account' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  );
}

const inputClass = 'w-full rounded-xl border border-[#91d2ff]/20 bg-[#030b16]/50 px-4 py-3 text-sm text-[#F5F7FF] outline-none placeholder:text-[#AAB8D0]/50 transition-colors focus:border-[#38C9FF]/60 focus:ring-2 focus:ring-[#38C9FF]/10';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5 text-left">
      <span className="text-xs font-medium text-[#AAB8D0]">{label}</span>
      {children}
    </label>
  );
}
