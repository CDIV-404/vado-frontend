# VADO — Vibes & Messages

A polished, responsive single-page rebuild of the VADO prototype: dark, glassmorphic, mobile-first, with the glowing VADO emblem, Framer Motion transitions, and fully mocked data (no backend required).

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS 3
- Framer Motion (page transitions, micro-interactions, reduced-motion support)
- Lucide React icons

## Run

```bash
pnpm install
pnpm dev        # http://localhost:5173
```

Build a production bundle:

```bash
pnpm build      # typecheck + bundle to dist/
pnpm preview    # serve dist/
```

## What's inside

| Screen | Notes |
| --- | --- |
| Splash | Animated emblem (strokes draw in, halo pulse), auto-advances ~2.2s |
| Welcome | Floating emblem, staggered entrance, glowing “Get Started” pill |
| Vibes feed | Following/Global tabs, search filter, cards, error → retry → loading → ready states, “Explore Global” |
| Studio | Interest chip grid (toggle + persistence), Skip, staggered spring entrance |
| Chat | Auth screen (validation, password toggle, social buttons, mock sign-in) → chat list → conversation with mock replies |
| Views | Empty state + mock analytics, CTA back to Global feed |
| VADO AI | Center button: tap = chat sheet, hold = voice “Listening…” → mock transcript; Esc / swipe-down closes |

- **Desktop (≥700px):** app is centered inside a glowing phone shell.
- **Mobile:** full-bleed with safe-area padding on the bottom nav.
- Session + interests persist in `localStorage`; clearing it restarts from the splash.
- All data is mocked in `src/data/mock.ts`.

## Structure

```
src/
  App.tsx              phase/tab state machine, transitions
  components/          AppShell, VadoEmblem, SplashScreen, WelcomeScreen,
                       BottomNav, AiSheet, Toast, ConnectionState
  screens/             VibesFeed, StudioOnboarding, AuthScreen, ChatHome, ViewsScreen
  data/mock.ts         mock vibes, interests, chats, AI replies
```
