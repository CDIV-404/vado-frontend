import { useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Compass, Eye, UserRound, Bell } from 'lucide-react';
import { AppShell } from './components/AppShell';
import { BottomNav, type Tab } from './components/BottomNav';
import { ToastProvider, useToast } from './components/Toast';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { VibesFeed } from './screens/VibesFeed';
import { AuthScreen, type Account } from './screens/AuthScreen';
import { DiscoverScreen } from './screens/DiscoverScreen';
import { StudioScreen } from './screens/StudioScreen';
import { ChatHome } from './screens/ChatHome';

function AppInner() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('home');
  const [phase, setPhase] = useState<'splash' | 'welcome' | 'app'>(() =>
    localStorage.getItem('vado.seenWelcome') === '1' ? 'app' : 'splash'
  );
  const [authOpen, setAuthOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [account, setAccount] = useState<Account | null>(() => {
    try {
      const saved = localStorage.getItem('vado.account') ?? localStorage.getItem('vado.testAccount');
      return saved ? JSON.parse(saved) as Account : null;
    } catch {
      return null;
    }
  });

  const requireAuth = (action: string) => {
    if (account) {
      if (action.includes('create')) setTab('create');
      else if (action.includes('Inbox') || action.includes('message')) setTab('inbox');
      else if (action.includes('profile')) setTab('profile');
      else if (action.toLowerCase().includes('notification')) toast('Notifications will appear when VADO services are connected.');
      else if (action.toLowerCase().includes('personalize')) toast('Discover personalization will be available when VADO services are connected.');
      return;
    }
    setPendingAction(action);
    setAuthOpen(true);
  };

  const selectTab = (next: Tab) => {
    if (!account && (next === 'create' || next === 'inbox' || next === 'profile')) {
      requireAuth(next);
      return;
    }
    setTab(next);
  };

  const content = tab === 'home' ? (
    <VibesFeed
      session={account?.username ?? null}
      onCreate={() => requireAuth('create a video')}
      onSearch={() => setTab('discover')}
      onRequireAuth={requireAuth}
    />
  ) : tab === 'discover' ? (
    <DiscoverScreen onRequireAuth={requireAuth} isAuthenticated={Boolean(account)} />
  ) : tab === 'create' ? (
    <StudioScreen />
  ) : tab === 'inbox' ? (
    <ChatHome />
  ) : tab === 'views' ? (
    <ViewsPanel />
  ) : (
    <AccountProfile
      account={account}
      onSignIn={() => requireAuth('open your profile')}
      onSignOut={() => {
        localStorage.removeItem('vado.account');
        localStorage.removeItem('vado.testAccount');
        setAccount(null);
        setTab('home');
      }}
    />
  );

  return (
    <MotionConfig reducedMotion="user">
      <AppShell>
        <AnimatePresence mode="wait">
          {phase === 'splash' ? (
            <SplashScreen key="splash" onDone={() => setPhase('welcome')} />
          ) : phase === 'welcome' ? (
            <WelcomeScreen
              key="welcome"
              onStart={() => {
                localStorage.setItem('vado.seenWelcome', '1');
                setPhase('app');
              }}
            />
          ) : (
            <motion.div
              key="app"
              className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <header className="vado-topbar">
                <button type="button" onClick={() => setTab('home')} className="vado-wordmark" aria-label="VADO home">VADO</button>
                <div className="ml-auto flex items-center gap-1">
                  <button type="button" onClick={() => setTab('discover')} aria-label="Search" className="vado-icon-button">
                    <Compass size={17} />
                  </button>
                  <button type="button" onClick={() => requireAuth('view notifications')} aria-label="Notifications" className="vado-icon-button">
                    <Bell size={17} />
                  </button>
                  {account && (
                    <button
                      type="button"
                      onClick={() => setTab('profile')}
                      aria-label={`Profile for ${account.displayName}`}
                      className="vado-avatar"
                    >
                      {account.displayName.slice(0, 1).toUpperCase()}
                    </button>
                  )}
                  {!account && (
                    <button type="button" onClick={() => requireAuth('sign in')} className="vado-signin">
                      Sign in
                    </button>
                  )}
                </div>
              </header>
              <main className="relative min-h-0 flex-1 overflow-hidden pb-[96px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tab}
                    className="h-full"
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.99 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {content}
                  </motion.div>
                </AnimatePresence>
              </main>
              <BottomNav active={tab} onSelect={selectTab} />
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {authOpen && (
            <AuthScreen
              key="auth"
              action={pendingAction ?? undefined}
              onBack={() => { setAuthOpen(false); setPendingAction(null); }}
              onAccountCreated={(account) => {
                setAccount(account);
                setAuthOpen(false);
                const action = pendingAction?.toLowerCase() ?? '';
                setTab(action.includes('create') ? 'create' : action.includes('inbox') || action.includes('message') ? 'inbox' : action.includes('profile') ? 'profile' : 'home');
                setPendingAction(null);
              }}
            />
          )}
        </AnimatePresence>
      </AppShell>
    </MotionConfig>
  );
}

function ViewsPanel() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#91d2ff]/25 bg-[#1687ff]/10 text-[#38c9ff]">
        <Eye size={24} />
      </span>
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#67baff]">Your views</p>
      <h1 className="mt-2 text-xl font-semibold text-[#f1f5fc]">Your insights start here</h1>
      <p className="mt-2 max-w-[250px] text-xs leading-5 text-[#aebed2]">Analytics will appear after your videos receive genuine views.</p>
      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        {['Video views', 'Watch time'].map((label) => (
          <div key={label} className="vado-glass-card px-3 py-4 text-left">
            <p className="text-[10px] uppercase tracking-wider text-[#aebed2]">{label}</p>
            <p className="mt-2 text-sm text-[#f1f5fc]">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountProfile({ account, onSignIn, onSignOut }: { account: Account | null; onSignIn: () => void; onSignOut: () => void }) {
  return (
    <div className="scroll-slim h-full overflow-y-auto px-5 py-10 sm:px-8">
      <div className="vado-glass-card mx-auto max-w-2xl rounded-3xl p-6 text-center sm:p-12">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#287CFF]/30 bg-[#287CFF]/10 text-[#38C9FF]">
          <UserRound size={25} />
        </span>
        <h1 className="mt-5 text-2xl font-semibold text-[#F5F7FF]">{account?.displayName ?? 'Your profile, your space'}</h1>
        {account ? (
          <>
            <p className="mt-2 text-sm text-[#AAB8D0]">@{account.username} · {account.accountType}</p>
            <p className="mx-auto mt-3 max-w-md text-xs leading-5 text-amber-200">Your profile is saved on this browser only. Account syncing and connected platform services are not available yet.</p>
            <button type="button" onClick={onSignOut} className="mt-6 rounded-full border border-[#91d2ff]/25 bg-[#123758]/25 px-6 py-3 text-sm font-medium text-[#F5F7FF] transition hover:border-[#38C9FF]/50 hover:bg-[#123758]/45">
              Sign out
            </button>
          </>
        ) : (
          <>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#AAB8D0]">
              Sign in to manage your profile, videos, privacy and account settings.
            </p>
            <button type="button" onClick={onSignIn} className="mt-6 rounded-full border border-[#67baff]/55 bg-gradient-to-r from-[#1687ff]/75 to-[#287CFF] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_24px_rgba(22,135,255,.25)] transition hover:shadow-[0_0_30px_rgba(56,201,255,.35)] active:scale-[.98]">
              Log in or create account
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
