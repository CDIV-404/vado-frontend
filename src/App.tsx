import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
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
import { SearchScreen } from './screens/SearchScreen';
import { CreateVibeScreen } from './screens/CreateVibeScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { ReferralsScreen } from './screens/ReferralsScreen';
import { MoodTimelineScreen } from './screens/MoodTimelineScreen';
import { RemixScreen } from './screens/RemixScreen';
import { CollectionsScreen } from './screens/CollectionsScreen';
import { CirclesScreen } from './screens/CirclesScreen';
import { CollabVibeScreen } from './screens/CollabVibeScreen';
import { CollabMarketScreen } from './screens/CollabMarketScreen';
import { EventsScreen } from './screens/EventsScreen';
import { SubscriptionsScreen } from './screens/SubscriptionsScreen';
import { DigitalMarketScreen } from './screens/DigitalMarketScreen';
import { LiveScreen } from './screens/LiveScreen';
import { SafetyScreen } from './screens/SafetyScreen';
import { AdminScreen } from './screens/AdminScreen';
import { load, save } from './lib/store';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen, loadSettings } from './screens/SettingsScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import type { CollabVibe, Vibe } from './data/mock';

export type Tab = 'vibes' | 'studio' | 'chat' | 'views';
type Phase = 'splash' | 'welcome' | 'app';
type Overlay =
  | { k: 'search' }
  | { k: 'create'; seed?: string }
  | { k: 'notifications' }
  | { k: 'settings' }
  | { k: 'profile'; handle?: string }
  | { k: 'analytics' }
  | { k: 'rewards' }
  | { k: 'referrals' }
  | { k: 'mood' }
  | { k: 'collections' }
  | { k: 'circles' }
  | { k: 'collab' }
  | { k: 'market' }
  | { k: 'events' }
  | { k: 'subs' }
  | { k: 'dmarket' }
  | { k: 'live' }
  | { k: 'safety' }
  | { k: 'admin' }
  | { k: 'remix'; vibe: Vibe }
  | null;

function collabToVibe(board: CollabVibe, session: string | null): Vibe {
  const others = board.roles.filter((r) => r.handle !== '@you').map((r) => r.handle);
  return {
    id: `my-${Date.now()}`,
    creator: session ?? 'You',
    handle: '@you',
    caption: board.caption || board.title,
    gradient: board.gradient,
    category: 'Art',
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    time: 'now',
    mood: board.mood,
    hashtags: [],
    format: 'visual',
    mine: true,
    visibility: 'public',
    language: 'en',
    allowRemix: true,
    coCreatedWith: others,
  };
}

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
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [published, setPublished] = useState<Vibe[]>(() => load<Vibe[]>('myVibes', []));
  const [reduceMotion, setReduceMotion] = useState(() => loadSettings().reduceMotion);
  const [dataSaver, setDataSaver] = useState(() => loadSettings().dataSaver);

  useEffect(() => {
    const fn = () => {
      const s = loadSettings();
      setReduceMotion(s.reduceMotion);
      setDataSaver(s.dataSaver);
    };
    window.addEventListener('vado:settings', fn);
    return () => window.removeEventListener('vado:settings', fn);
  }, []);

  const openExplore = useCallback(() => {
    setTab('vibes');
    setExploreKey((k) => k + 1);
  }, []);

  const seedCreator = useCallback((text: string) => {
    setOverlay({ k: 'create', seed: text });
    setAiMode('closed');
  }, []);

  const navigateFrom = useCallback((target: string) => {
    setAiMode('closed');
    if (target === 'vibes' || target === 'views' || target === 'chat' || target === 'studio') {
      setTab(target as Tab);
    } else if (target === 'profile') {
      setOverlay({ k: 'profile' });
    } else if (target === 'settings') {
      setOverlay({ k: 'settings' });
    } else if (target === 'mood') {
      setOverlay({ k: 'mood' });
    }
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
        return (
          <VibesFeed
            key="vibes"
            exploreGlobalKey={exploreKey}
            published={published}
            session={session}
            onOpenProfile={(handle) => setOverlay({ k: 'profile', handle })}
            onNotifications={() => setOverlay({ k: 'notifications' })}
            onCreate={() => setOverlay({ k: 'create' })}
            onSearch={() => setOverlay({ k: 'search' })}
            onOpenMood={() => setOverlay({ k: 'mood' })}
            onRemixVibe={(vibe) => setOverlay({ k: 'remix', vibe })}
          />
        );
      case 'studio':
        return <StudioOnboarding key="studio" onDone={() => setTab('vibes')} onBack={() => setTab('vibes')} />;
      case 'chat':
        return session ? (
          <ChatHome key="chat" onSignOut={() => setSession(null)} session={session} onSeedCreator={seedCreator} />
        ) : (
          <AuthScreen key="auth" onSignedIn={(name) => setSession(name)} onBack={() => setTab('vibes')} />
        );
      case 'views':
        return (
          <ViewsScreen
            key="views"
            onExplore={openExplore}
            onOpenTool={(tool) => setOverlay({ k: tool })}
            onOpenSettings={() => setOverlay({ k: 'settings' })}
          />
        );
    }
  })();

  return (
    <MotionConfig reducedMotion={reduceMotion ? 'always' : 'user'}>
      <AppShell dataSaver={dataSaver}>
      <ConnectionState />
      <div className="relative min-h-0 flex-1 pb-dock">
        <AnimatePresence mode="wait">
          <motion.div
            key={phase + tab + (tab === 'chat' ? String(Boolean(session)) : '')}
            className="h-full"
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
      <AiSheet
        mode={aiMode}
        recording={recording}
        session={session}
        onClose={() => setAiMode('closed')}
        onModeChange={setAiMode}
        onSeedCreator={seedCreator}
        onNavigate={navigateFrom}
      />
      <AnimatePresence>
        {overlay?.k === 'search' && (
          <SearchScreen key="search" onClose={() => setOverlay(null)} onOpenProfile={(handle) => setOverlay({ k: 'profile', handle })} />
        )}
        {overlay?.k === 'create' && (
          <CreateVibeScreen
            key="create"
            seed={overlay.seed}
            session={session}
            onPublish={(v) => setPublished((prev) => [v, ...prev])}
            onClose={() => setOverlay(null)}
          />
        )}
        {overlay?.k === 'notifications' && (
          <NotificationsScreen key="notifications" onClose={() => setOverlay(null)} />
        )}
        {overlay?.k === 'settings' && (
          <SettingsScreen
            key="settings"
            session={session}
            onClose={() => setOverlay(null)}
            onSignOut={() => setSession(null)}
          />
        )}
        {overlay?.k === 'profile' && (
          <ProfileScreen
            key="profile"
            handle={overlay.handle}
            session={session}
            published={published}
            onClose={() => setOverlay(null)}
            onCreate={() => setOverlay({ k: 'create' })}
            onOpenSettings={() => setOverlay({ k: 'settings' })}
          />
        )}
        {overlay?.k === 'analytics' && <AnalyticsScreen key="analytics" onClose={() => setOverlay(null)} />}
        {overlay?.k === 'rewards' && <RewardsScreen key="rewards" onClose={() => setOverlay(null)} />}
        {overlay?.k === 'referrals' && <ReferralsScreen key="referrals" onClose={() => setOverlay(null)} />}
        {overlay?.k === 'mood' && <MoodTimelineScreen key="mood" onClose={() => setOverlay(null)} />}
        {overlay?.k === 'collections' && <CollectionsScreen key="collections" published={published} onClose={() => setOverlay(null)} />}
        {overlay?.k === 'circles' && <CirclesScreen key="circles" session={session} onClose={() => setOverlay(null)} />}
        {overlay?.k === 'collab' && (
          <CollabVibeScreen
            key="collab"
            session={session}
            onClose={() => setOverlay(null)}
            onPublish={(board) => {
              const v = collabToVibe(board, session);
              setPublished((prev) => {
                const next = [v, ...prev];
                save('myVibes', next);
                return next;
              });
            }}
          />
        )}
        {overlay?.k === 'market' && <CollabMarketScreen key="market" session={session} onClose={() => setOverlay(null)} />}
        {overlay?.k === 'events' && <EventsScreen key="events" onClose={() => setOverlay(null)} />}
        {overlay?.k === 'subs' && <SubscriptionsScreen key="subs" onClose={() => setOverlay(null)} />}
        {overlay?.k === 'dmarket' && <DigitalMarketScreen key="dmarket" onClose={() => setOverlay(null)} />}
        {overlay?.k === 'live' && <LiveScreen key="live" session={session} onClose={() => setOverlay(null)} />}
        {overlay?.k === 'safety' && <SafetyScreen key="safety" onClose={() => setOverlay(null)} />}
        {overlay?.k === 'admin' && <AdminScreen key="admin" onClose={() => setOverlay(null)} />}
        {overlay?.k === 'remix' && (
          <RemixScreen
            key={`remix-${overlay.vibe.id}`}
            vibe={overlay.vibe}
            published={published}
            session={session}
            onPublish={(v) => setPublished((prev) => [v, ...prev])}
            onClose={() => setOverlay(null)}
          />
        )}
      </AnimatePresence>
      </AppShell>
    </MotionConfig>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
