import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppShell } from './components/AppShell';
import { SplashScreen } from './components/SplashScreen';
import { WelcomeScreen } from './components/WelcomeScreen';
import { BottomNav } from './components/BottomNav';
import { AiSheet, type AiMode } from './components/AiSheet';
import { ConnectionState } from './components/ConnectionState';
import { ToastProvider } from './components/Toast';
import { VibesFeed } from './screens/VibesFeed';
import { StudioOnboarding } from './screens/StudioOnboarding';
import { ViewsScreen } from './screens/ViewsScreen';
import { AuthScreen } from './screens/AuthScreen';
import { ChatHome } from './screens/ChatHome';

export type Tab = 'vibes' | 'studio' | 'chat' | 'views';
type Phase = 'splash' | 'welcome' | 'app';

function AppInner() {
  const [phase, setPhase] = useState<Phase>(() =>
    localStorage.getItem('vado.seenWelcome') ? 'app' : 'splash'
  );
  const [tab, setTab] = useState<Tab>('vibes');
  const [exploreKey, setExploreKey] = useState(0);
  const [session, setSession] = useState<string | null>(() => {
    try {
      return JSON.parse(localStorage.getItem('vado.session') ?? 'null')?.name ?? null;
    } catch {
      return null;
    }
  });
  const [aiMode, setAiMode] = useState<AiMode>('closed');
  const [recording, setRecording] = useState(false);

  const openExplore = useCallback(() => {
    setTab('vibes');
    setExploreKey((k) => k + 1);
  }, []);

  const screen = (() => {
    if (phase === 'splash') return <SplashScreen key="splash" onDone={() => setPhase('welcome')} />;
    if (phase === 'welcome')
      return (
        <WelcomeScreen
          key="welcome"
          onStart={() => {
            localStorage.setItem('vado.seenWelcome', '1');
            setPhase('app');
          }}
        />
      );
    switch (tab) {
      case 'vibes':
        return <VibesFeed key="vibes" exploreGlobalKey={exploreKey} />;
      case 'studio':
        return <StudioOnboarding key="studio" onDone={() => setTab('vibes')} onBack={() => setTab('vibes')} />;
      case 'chat':
        return session ? (
          <ChatHome key="chat" onSignOut={() => setSession(null)} />
        ) : (
          <AuthScreen key="auth" onSignedIn={(name) => setSession(name)} onBack={() => setTab('vibes')} />
        );
      case 'views':
        return <ViewsScreen key="views" onExplore={openExplore} />;
    }
  })();

  return (
    <AppShell>
      <ConnectionState />
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase + tab + (tab === 'chat' ? String(Boolean(session)) : '')}
            className="absolute inset-0"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            {screen}
          </motion.div>
        </AnimatePresence>
      </div>
      {phase === 'app' && (
        <BottomNav
          active={tab}
          onSelect={setTab}
          aiOpen={aiMode !== 'closed'}
          onAiTap={() => setAiMode((m) => (m === 'closed' ? 'chat' : 'closed'))}
          onAiHoldStart={() => {
            setAiMode('voice');
            setRecording(true);
          }}
          onAiHoldEnd={() => setRecording(false)}
        />
      )}
      <AiSheet mode={aiMode} recording={recording} onClose={() => setAiMode('closed')} onModeChange={setAiMode} />
    </AppShell>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
