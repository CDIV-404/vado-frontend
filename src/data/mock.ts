export type VibeFormat = 'visual' | 'video' | 'quote' | 'mood' | 'text';

export type Vibe = {
  id: string;
  creator: string;
  handle: string;
  caption: string;
  gradient: string;
  category: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  time: string;
  mood: string;
  hashtags: string[];
  format: VibeFormat;
  following?: boolean;
  mine?: boolean;
  visibility?: 'public' | 'followers' | 'private';
  language?: string;
  translations?: Record<string, string>;
  remixOf?: string;
  remixedFrom?: string;
  coCreatedWith?: string[];
  allowRemix?: boolean;
  aiGenerated?: boolean;
};

export type User = {
  handle: string;
  name: string;
  bio: string;
  location: string;
  joined: string;
  avatar: string;
  followers: number;
  following: number;
  vibes: number;
  likes: number;
  views: number;
  moodTags: string[];
  website?: string;
  verified?: boolean;
};

export type Comment = { id: string; author: string; text: string; time: string };

export const MOODS: { label: string; color: string }[] = [
  { label: 'Calm', color: '#38c9ff' },
  { label: 'Happy', color: '#fbbf24' },
  { label: 'Sad', color: '#818cf8' },
  { label: 'Excited', color: '#f472b6' },
  { label: 'Focused', color: '#34d399' },
  { label: 'Inspired', color: '#a78bfa' },
  { label: 'Confident', color: '#22d3ee' },
  { label: 'Nostalgic', color: '#fb923c' },
  { label: 'Curious', color: '#4ade80' },
  { label: 'Chaotic', color: '#ef4444' },
];

export const CATEGORIES = [
  'Music', 'Travel', 'Art', 'Food', 'Gaming', 'Dance', 'Science', 'Comedy',
  'Fashion', 'Nature', 'Film', 'Sports', 'DIY', 'Photography', 'Oddly Satisfying',
];

export const HASHTAGS = [
  '#vibes', '#midnight', '#lofi', '#goldenhour', '#studymode', '#neon',
  '#satisfying', '#createeveryday', '#vadoai', '#moodboard', '#citypop', '#wanderlust',
];

export const GLOBAL_VIBES: Vibe[] = [
  {
    id: 'g1', creator: 'Nova', handle: '@nova.wav',
    caption: 'midnight skyline loop 🌃 sound on for the full effect',
    gradient: 'linear-gradient(135deg,#0b3a6b,#1687ff 55%,#38c9ff)',
    category: 'Travel', views: 12400, likes: 2100, comments: 48, shares: 96,
    time: '2h', mood: 'Nostalgic', hashtags: ['#midnight', '#citypop'], format: 'video', following: true,
  },
  {
    id: 'g2', creator: 'Pixel Poa', handle: '@pixel.poa',
    caption: 'neon rain on glass — 10 hours of this and I still miss it',
    gradient: 'linear-gradient(135deg,#123c50,#1f8a70 60%,#a7f3d0)',
    category: 'Oddly Satisfying', views: 48900, likes: 9700, comments: 212, shares: 431,
    time: '4h', mood: 'Calm', hashtags: ['#satisfying', '#neon'], format: 'visual', following: true, aiGenerated: true,
  },
  {
    id: 'g3', creator: 'Lofi Luna', handle: '@lofi.luna',
    caption: 'made this beat in 20 minutes — it is 90% cat walking on the keyboard',
    gradient: 'linear-gradient(135deg,#1e1b4b,#6d28d9 55%,#38c9ff)',
    category: 'Music', views: 7200, likes: 1400, comments: 33, shares: 21,
    time: '6h', mood: 'Inspired', hashtags: ['#lofi', '#vibes'], format: 'video', following: true,
  },
  {
    id: 'g4', creator: 'Crumb Co', handle: '@crumb.co', remixOf: 'g1', remixedFrom: '@nova.wav',
    caption: 'the cheese pull heard round the world 🧀',
    gradient: 'linear-gradient(135deg,#78350f,#f59e0b 60%,#fde68a)',
    category: 'Food', views: 103000, likes: 18200, comments: 640, shares: 1200,
    time: '8h', mood: 'Happy', hashtags: ['#createeveryday'], format: 'visual',
  },
  {
    id: 'g5', creator: 'Ink Studio', handle: '@ink.studio',
    caption: '“The pen knows the mood before the hand does.” — studio notes, 3am',
    gradient: 'linear-gradient(135deg,#0f172a,#334155 55%,#94a3b8)',
    category: 'Art', views: 22600, likes: 5300, comments: 87, shares: 260,
    time: '11h', mood: 'Focused', hashtags: ['#moodboard'], format: 'quote',
  },
  {
    id: 'g6', creator: 'Orbit Oz', handle: '@orbit.oz',
    caption: 'satellite pass over the desert 🛰️ no filter, just physics',
    gradient: 'linear-gradient(135deg,#082f49,#0ea5e9 60%,#e0f2fe)',
    category: 'Science', views: 61800, likes: 12900, comments: 301, shares: 780,
    time: '14h', mood: 'Curious', hashtags: ['#vibes', '#wanderlust'], format: 'video', aiGenerated: true,
  },
  {
    id: 'g7', creator: 'Mira Sol', handle: '@mira.sol', remixOf: 'g3', remixedFrom: '@lofi.luna',
    caption: 'current mood: soft static and warm tea ☕ low battery, high heart',
    gradient: 'linear-gradient(135deg,#3b0764,#a21caf 55%,#fbcfe8)',
    category: 'Fashion', views: 4100, likes: 980, comments: 12, shares: 8,
    time: '16h', mood: 'Calm', hashtags: ['#goldenhour'], format: 'mood',
  },
  {
    id: 'g8', creator: 'Bit Boss', handle: '@bit.boss', remixOf: 'g7', remixedFrom: '@mira.sol',
    caption: 'speedran the level, forgot to record. this is my face after: 🫠',
    gradient: 'linear-gradient(135deg,#111827,#ef4444 60%,#fca5a5)',
    category: 'Gaming', views: 87000, likes: 21000, comments: 890, shares: 1400,
    time: '19h', mood: 'Chaotic', hashtags: ['#vibes'], format: 'text',
  },
  {
    id: 'g9', creator: 'Fern Field', handle: '@fern.field',
    caption: 'morning fog rolling through the valley — took 4 minutes to walk, 4 hours to describe',
    gradient: 'linear-gradient(135deg,#064e3b,#34d399 60%,#d1fae5)',
    category: 'Nature', views: 15600, likes: 3400, comments: 56, shares: 130,
    time: '22h', mood: 'Inspired', hashtags: ['#wanderlust', '#goldenhour'], format: 'visual',
  },
];

export const FOLLOWING_VIBES: Vibe[] = GLOBAL_VIBES.filter((v) => v.following);

export const USERS: User[] = [
  {
    handle: '@nova.wav', name: 'Nova', bio: 'city lights + long exposures 🌃 shooting the quiet hours',
    location: 'Tokyo, JP', joined: 'March 2024', avatar: 'linear-gradient(135deg,#1687ff,#38c9ff)',
    followers: 48200, following: 312, vibes: 214, likes: 96400, views: 1840000,
    moodTags: ['Nostalgic', 'Calm', 'Focused'], website: 'novawav.vado', verified: true,
  },
  {
    handle: '@lofi.luna', name: 'Lofi Luna', bio: 'beats to vibe out to 🎧 new tape every friday',
    location: 'Lisbon, PT', joined: 'January 2024', avatar: 'linear-gradient(135deg,#6d28d9,#38c9ff)',
    followers: 22100, following: 190, vibes: 96, likes: 41000, views: 620000,
    moodTags: ['Inspired', 'Calm'], verified: true,
  },
  {
    handle: '@crumb.co', name: 'Crumb Co', bio: 'food that refuses to behave 🧀 recipes in captions',
    location: 'Mexico City, MX', joined: 'June 2024', avatar: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    followers: 132000, following: 411, vibes: 388, likes: 402000, views: 9100000,
    moodTags: ['Happy', 'Chaotic'], website: 'crumb.co',
  },
  {
    handle: '@orbit.oz', name: 'Orbit Oz', bio: 'science communicator 🛰️ physics is a mood',
    location: 'Canberra, AU', joined: 'February 2024', avatar: 'linear-gradient(135deg,#0ea5e9,#e0f2fe)',
    followers: 67400, following: 122, vibes: 141, likes: 158000, views: 3300000,
    moodTags: ['Curious', 'Focused'], verified: true,
  },
  {
    handle: '@pixel.poa', name: 'Pixel Poa', bio: 'oddly satisfying loops & texture studies',
    location: 'Seoul, KR', joined: 'April 2024', avatar: 'linear-gradient(135deg,#1f8a70,#a7f3d0)',
    followers: 39800, following: 84, vibes: 120, likes: 88700, views: 1500000,
    moodTags: ['Calm'],
  },
];

export const COMMENTS: Record<string, Comment[]> = {
  g1: [
    { id: 'c1a', author: '@mira.sol', text: 'the 3am skyline never misses', time: '1h' },
    { id: 'c1b', author: '@bit.boss', text: 'what lens is this??', time: '2h' },
  ],
  g2: [
    { id: 'c2a', author: '@lofi.luna', text: 'putting this on my wall fr', time: '3h' },
  ],
  g4: [
    { id: 'c4a', author: '@nova.wav', text: 'recipe or it didn’t happen', time: '5h' },
    { id: 'c4b', author: '@fern.field', text: 'made this. cried. 10/10', time: '6h' },
  ],
};

export type Interest = { emoji: string; label: string };

export const INTERESTS: Interest[] = [
  { emoji: '🐾', label: 'Animals' }, { emoji: '😂', label: 'Comedy' },
  { emoji: '✈️', label: 'Travel' }, { emoji: '🍔', label: 'Food' },
  { emoji: '🏀', label: 'Sports' }, { emoji: '💄', label: 'Beauty & Style' },
  { emoji: '🎨', label: 'Art' }, { emoji: '🎮', label: 'Gaming' },
  { emoji: '🔬', label: 'Science & Education' }, { emoji: '💃', label: 'Dance' },
  { emoji: '✂️', label: 'DIY' }, { emoji: '🏍️', label: 'Auto' },
  { emoji: '🎵', label: 'Music' }, { emoji: '💡', label: 'Life Hacks' },
  { emoji: '✨', label: 'Oddly Satisfying' }, { emoji: '🌿', label: 'Outdoors' },
  { emoji: '🌟', label: 'Fandom' },
];

export type Chat = {
  id: string;
  name: string;
  avatar: string;
  last: string;
  time: string;
  unread: number;
  messages: { from: 'me' | 'them'; text: string }[];
};

export const CHATS: Chat[] = [
  {
    id: 'c1', name: 'Nova', avatar: 'linear-gradient(135deg,#1687ff,#38c9ff)',
    last: 'sending the raw clips now 🎥', time: '2m', unread: 2,
    messages: [
      { from: 'them', text: 'yo did you see the skyline loop?' },
      { from: 'me', text: 'yeah the color grade is unreal' },
      { from: 'them', text: 'sending the raw clips now 🎥' },
    ],
  },
  {
    id: 'c2', name: 'Lofi Luna', avatar: 'linear-gradient(135deg,#6d28d9,#38c9ff)',
    last: 'track drops friday 🎧', time: '1h', unread: 0,
    messages: [
      { from: 'me', text: 'can I remix the second verse?' },
      { from: 'them', text: 'track drops friday 🎧' },
    ],
  },
  {
    id: 'c3', name: 'Crumb Co', avatar: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    last: 'the cheese pull was 4K or it didn’t happen', time: '3h', unread: 1,
    messages: [{ from: 'them', text: 'the cheese pull was 4K or it didn’t happen' }],
  },
];

export type NotifKind =
  | 'like' | 'comment' | 'follower' | 'message' | 'ai' | 'reward'
  | 'payout' | 'referral' | 'campaign' | 'stream' | 'gift' | 'moderation' | 'incident'
  | 'mood' | 'goal' | 'circle' | 'collab' | 'marketplace'
  | 'event' | 'subscription' | 'purchase' | 'safety';

export type Notification = {
  id: string;
  kind: NotifKind;
  text: string;
  time: string;
  unread: boolean;
  priority: 'high' | 'normal';
};

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', kind: 'like', text: 'Lofi Luna and 24 others liked your Vibe', time: '3m', unread: true, priority: 'normal' },
  { id: 'n2', kind: 'follower', text: '@orbit.oz started following you', time: '18m', unread: true, priority: 'normal' },
  { id: 'n3', kind: 'comment', text: 'Crumb Co: “this grade is unreal” on your Vibe', time: '42m', unread: true, priority: 'normal' },
  { id: 'n4', kind: 'ai', text: 'VADO AI drafted 3 captions for your golden-hour idea', time: '1h', unread: true, priority: 'normal' },
  { id: 'n5', kind: 'reward', text: 'Engagement bonus unlocked: +250 demo coins', time: '3h', unread: false, priority: 'high' },
  { id: 'n6', kind: 'referral', text: 'Your friend joined — reward pending first Vibe', time: '5h', unread: false, priority: 'normal' },
  { id: 'n7', kind: 'stream', text: 'Nova is live: “Editing the skyline loop”', time: '6h', unread: false, priority: 'normal' },
  { id: 'n8', kind: 'payout', text: 'Demo payout of 1,200 coins scheduled for Friday', time: '1d', unread: false, priority: 'normal' },
  { id: 'n9', kind: 'campaign', text: 'Creative Streak: 4 days left to keep it alive', time: '1d', unread: false, priority: 'high' },
  { id: 'n10', kind: 'gift', text: 'A supporter sent you a Star (demo)', time: '2d', unread: false, priority: 'normal' },
  { id: 'n11', kind: 'moderation', text: 'A comment on your Vibe was reviewed and kept', time: '2d', unread: false, priority: 'normal' },
  { id: 'n12', kind: 'incident', text: 'Live chat latency resolved — all systems nominal', time: '3d', unread: false, priority: 'normal' },
  { id: 'n13', kind: 'mood', text: 'Daily check-in: your Mood Timeline is waiting (private)', time: '2h', unread: true, priority: 'normal' },
  { id: 'n14', kind: 'goal', text: 'Goal progress: 1 of 3 onboarding goals done — try one AI remix', time: '1d', unread: false, priority: 'normal' },
  { id: 'n15', kind: 'circle', text: 'Night Drive Club: 3 new posts since your last visit', time: '40m', unread: true, priority: 'normal' },
  { id: 'n16', kind: 'collab', text: '@nova.wav is editing your shared Vibe board right now', time: '1h', unread: true, priority: 'normal' },
  { id: 'n17', kind: 'marketplace', text: 'A collaboration request you sent is waiting on a reply', time: '6h', unread: false, priority: 'normal' },
  { id: 'n18', kind: 'event', text: 'Skyline Loop drop starts soon — you RSVP’d', time: '25m', unread: true, priority: 'high' },
  { id: 'n19', kind: 'subscription', text: 'Your Signal support renews in 5 days (demo coins)', time: '1d', unread: false, priority: 'normal' },
  { id: 'n20', kind: 'purchase', text: 'Night Drive LUTs is in your library — personal-use licence', time: '2d', unread: false, priority: 'normal' },
  { id: 'n21', kind: 'safety', text: 'Your report against a comment was reviewed — action taken', time: '4h', unread: true, priority: 'high' },
];

export const VOICE_TRANSCRIPT = '“find me something calm for tonight”';

export const SUGGESTED_PROMPTS = [
  'Give me a caption for this mood.',
  'Help me create a Vibe.',
  'What should I post today?',
  'Turn this feeling into a post.',
  'Make this caption more poetic.',
  'Give me three content ideas.',
  'Improve my bio.',
  'Explain my analytics.',
  'How can I earn more rewards?',
  'Write a friendly referral message.',
  'Translate this Vibe.',
  'Summarize this live stream.',
];

export const GRADIENTS = [
  'linear-gradient(135deg,#0b3a6b,#1687ff 55%,#38c9ff)',
  'linear-gradient(135deg,#1e1b4b,#6d28d9 55%,#38c9ff)',
  'linear-gradient(135deg,#78350f,#f59e0b 60%,#fde68a)',
  'linear-gradient(135deg,#064e3b,#34d399 60%,#d1fae5)',
  'linear-gradient(135deg,#3b0764,#a21caf 55%,#fbcfe8)',
  'linear-gradient(135deg,#0f172a,#334155 55%,#94a3b8)',
];

export const LANGUAGES = [
  { code: 'en', native: 'English', label: 'English', pct: 100 },
  { code: 'es', native: 'Español', label: 'Spanish', pct: 96 },
  { code: 'fr', native: 'Français', label: 'French', pct: 94 },
  { code: 'de', native: 'Deutsch', label: 'German', pct: 93 },
  { code: 'pt', native: 'Português', label: 'Portuguese', pct: 91 },
  { code: 'it', native: 'Italiano', label: 'Italian', pct: 90 },
  { code: 'nl', native: 'Nederlands', label: 'Dutch', pct: 87 },
  { code: 'ar', native: 'العربية', label: 'Arabic', pct: 84, rtl: true },
  { code: 'hi', native: 'हिन्दी', label: 'Hindi', pct: 82 },
  { code: 'bn', native: 'বাংলা', label: 'Bengali', pct: 76 },
  { code: 'ja', native: '日本語', label: 'Japanese', pct: 92 },
  { code: 'ko', native: '한국어', label: 'Korean', pct: 89 },
  { code: 'zh-CN', native: '简体中文', label: 'Simplified Chinese', pct: 93 },
  { code: 'zh-TW', native: '繁體中文', label: 'Traditional Chinese', pct: 85 },
  { code: 'tr', native: 'Türkçe', label: 'Turkish', pct: 81 },
  { code: 'vi', native: 'Tiếng Việt', label: 'Vietnamese', pct: 79 },
  { code: 'id', native: 'Bahasa Indonesia', label: 'Indonesian', pct: 80 },
  { code: 'sw', native: 'Kiswahili', label: 'Swahili', pct: 71 },
];

export function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

// ---------- Phase 2: analytics, rewards, referrals (aggregated / masked only) ----------

export type DailyPoint = { day: string; views: number; likes: number; saves: number; shares: number };

export function analyticsSeries(days: number): DailyPoint[] {
  const out: DailyPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const t = days - i;
    const base = 320 + 140 * Math.sin(t / 6.3) + 60 * Math.sin(t / 2.1) + t * 2.4;
    const views = Math.max(40, Math.round(base));
    out.push({
      day: d.toISOString().slice(0, 10),
      views,
      likes: Math.round(views * (0.14 + 0.05 * Math.sin(t / 4.7))),
      saves: Math.round(views * (0.05 + 0.02 * Math.sin(t / 3.1))),
      shares: Math.round(views * (0.02 + 0.01 * Math.sin(t / 5.3))),
    });
  }
  return out;
}

export type Campaign = {
  id: string;
  name: string;
  desc: string;
  goal: number;
  progress: number;
  reward: number;
  ends: string;
};

export const CAMPAIGNS: Campaign[] = [
  { id: 'cp1', name: 'Creative Streak', desc: 'Post a Vibe 7 days in a row.', goal: 7, progress: 3, reward: 250, ends: '4 days left' },
  { id: 'cp2', name: 'Golden Hour Club', desc: '3 vibes tagged #goldenhour this week.', goal: 3, progress: 2, reward: 180, ends: '2 days left' },
  { id: 'cp3', name: 'Comment Champion', desc: 'Reply to 20 comments on your vibes.', goal: 20, progress: 12, reward: 320, ends: '9 days left' },
  { id: 'cp4', name: 'Remix Roundhouse', desc: 'Publish 2 remixes from the community.', goal: 2, progress: 0, reward: 400, ends: '14 days left' },
];

export type RewardEvent = { id: string; label: string; coins: number; time: string; status: 'completed' | 'pending' | 'reversed' };

export const REWARD_HISTORY: RewardEvent[] = [
  { id: 'r1', label: 'Engagement bonus', coins: 250, time: '3h', status: 'completed' },
  { id: 'r2', label: 'Streak day 3', coins: 60, time: '1d', status: 'completed' },
  { id: 'r3', label: 'Referral — first vibe', coins: 150, time: '2d', status: 'completed' },
  { id: 'r4', label: 'Campaign preview grant', coins: 100, time: '4d', status: 'reversed' },
  { id: 'r5', label: 'Demo payout scheduled', coins: -1200, time: '5d', status: 'pending' },
];

export const DEMO_PAYOUT_ACCOUNT = 'Demo wallet •••• 4041';

export type ReferralStatus = 'invited' | 'joined' | 'first_vibe' | 'rewarded';

export type Referral = { name: string; masked: string; status: ReferralStatus; when: string };

export const REFERRAL_CODE = 'VADO-4041-CALM';

export const REFERRALS: Referral[] = [
  { name: 'Mira Sol', masked: '@m***.sol', status: 'rewarded', when: '6d' },
  { name: 'Fern Field', masked: '@f***.field', status: 'first_vibe', when: '3d' },
  { name: 'Bit Boss', masked: '@b***.boss', status: 'joined', when: '1d' },
  { name: 'Ink Studio', masked: '@i***.studio', status: 'invited', when: '2d' },
  { name: 'Orbit Oz', masked: '@o***.oz', status: 'invited', when: '5h' },
];

export const REFERRAL_TIERS = [
  { need: 1, reward: 150, label: 'First friend joins + posts' },
  { need: 3, reward: 500, label: '3 active referrals' },
  { need: 5, reward: 1200, label: '5 active referrals — Creator Kit' },
];

export const TOP_CATEGORIES = [
  { label: 'Travel', pct: 34 },
  { label: 'Music', pct: 26 },
  { label: 'Oddly Satisfying', pct: 18 },
  { label: 'Art', pct: 12 },
  { label: 'Food', pct: 10 },
];

export const DEFAULT_COINS = 2450;

import type { AiPersonality } from '../lib/ai';

export type Personality = { id: AiPersonality; label: string; desc: string };

export const PERSONALITIES: Personality[] = [
  { id: 'calm', label: 'Calm', desc: ' unhurried, lowercase, one grounding line.' },
  { id: 'playful', label: 'Playful', desc: ' game — light emoji, short punchy lines.' },
  { id: 'poetic', label: 'Poetic', desc: ' a small piece of writing. Imagery first.' },
  { id: 'direct', label: 'Direct', desc: ' the answer, then one next step. No filler.' },
  { id: 'coach', label: 'Coach', desc: ' a plan and a nudge — you always leave with a step.' },
  { id: 'curious', label: 'Curious', desc: ' questions back, follows the thread where it gets interesting.' },
  { id: 'wit', label: 'Witty', desc: ' dry and a little unhinged (but never at you).' },
  { id: 'minimal', label: 'Minimal', desc: ' three words when three will do.' },
  { id: 'warm', label: 'Warm', desc: ' a friend who is genuinely glad you showed up.' },
];

export type MoodEntry = { date: string; mood: string; note?: string };

export function seedMoodEntries(): MoodEntry[] {
  const moods = ['Calm', 'Focused', 'Happy', 'Tired', 'Inspired', 'Nostalgic', 'Calm', 'Curious', 'Chaotic', 'Calm', 'Focused', 'Happy', 'Inspired', 'Calm', 'Sad', 'Focused', 'Happy', 'Calm', 'Inspired', 'Curious'];
  const today = new Date();
  return moods.map((m, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (moods.length - 1 - i));
    return { date: isoDate(d), mood: m, note: i % 7 === 3 ? 'late night, low light' : undefined };
  });
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type OnboardingGoal = { id: string; text: string; done: boolean };

export const DEFAULT_GOALS: OnboardingGoal[] = [
  { id: 'goal1', text: 'Post 3 vibes this week', done: false },
  { id: 'goal2', text: 'Try one AI remix', done: false },
  { id: 'goal3', text: 'Join a circle that matches your mood', done: false },
];

export const TODAY_PROMPTS = [
  'Post something you almost deleted.',
  'One frame of your morning, no context needed.',
  'A sound that carried your week.',
  'Show the mess, not the masterpiece.',
  'Color of the day — one word caption.',
  'Remix an old mood into a new one.',
  'Something that felt calm today.',
];

export const DAILY_STATS = [
  { label: 'vibes published today', value: '1,284' },
  { label: 'creators active right now', value: '342' },
  { label: 'new circles this week', value: '7' },
];

export type RemixAction = { id: string; label: string; hint: string };

export const REMIX_ACTIONS: RemixAction[] = [
  { id: 'flip', label: 'Flip the mood', hint: 'keeps the shape, changes the weather' },
  { id: 'rewrite', label: 'Rewrite the caption', hint: 'same feeling, new voice' },
  { id: 'continue', label: 'Continue the story', hint: 'your vibe answers theirs' },
  { id: 'grade', label: 'Change the color grade', hint: 're-palette the frame' },
  { id: 'translate', label: 'Translate the feeling', hint: 'carry it to another language' },
];

export type Collection = {
  id: string;
  name: string;
  vibeIds: string[];
  visibility: 'private' | 'public' | 'collab';
  createdBy: string;
  role: 'Owner' | 'Editor' | 'Contributor' | 'Viewer';
};

export function seedCollections(): Collection[] {
  return [
    { id: 'col1', name: 'Night drive energy', vibeIds: ['g1', 'g6', 'g8'], visibility: 'private', createdBy: 'you', role: 'Owner' },
    { id: 'col2', name: 'Things that calm me down', vibeIds: ['g3', 'g7'], visibility: 'public', createdBy: 'you', role: 'Owner' },
  ];
}

export type Badge = {
  id: string;
  name: string;
  desc: string;
  metric: 'published' | 'streak' | 'remixes' | 'saved' | 'followers' | 'collections' | 'coins' | 'referrals' | 'comments' | 'explorer' | 'early';
  goal: number;
};

export const BADGES: Badge[] = [
  { id: 'first-vibe', name: 'First Light', desc: 'Publish your first Vibe', metric: 'published', goal: 1 },
  { id: 'streak-7', name: 'Streak Keeper', desc: 'Post 7 days in a row', metric: 'streak', goal: 7 },
  { id: 'remix-3', name: 'Remix Rookie', desc: 'Publish 3 remixes', metric: 'remixes', goal: 3 },
  { id: 'collector', name: 'Collector', desc: 'Save 10 vibes', metric: 'saved', goal: 10 },
  { id: 'social', name: 'Social Butterfly', desc: 'Follow 5 creators', metric: 'followers', goal: 5 },
  { id: 'curator', name: 'Curator', desc: 'Create 2 collections', metric: 'collections', goal: 2 },
  { id: 'campaign', name: 'Campaign Runner', desc: 'Claim 1 campaign reward', metric: 'coins', goal: 1 },
  { id: 'inviter', name: 'Inviter', desc: 'Refer a friend who joins', metric: 'referrals', goal: 1 },
  { id: 'conversalist', name: 'Conversalist', desc: 'Leave 5 comments', metric: 'comments', goal: 5 },
  { id: 'explorer', name: 'Explorer', desc: 'Visit 3 circles', metric: 'explorer', goal: 3 },
  { id: 'early', name: 'Early Signal', desc: 'With VADO from the start', metric: 'early', goal: 1 },
];

export type BadgeStats = {
  published: number;
  streak: number;
  remixes: number;
  saved: number;
  followers: number;
  collections: number;
  coins: number;
  referrals: number;
  comments: number;
  explorer: number;
  early: number;
};

export function computeBadges(stats: BadgeStats): { badge: Badge; value: number; earned: boolean }[] {
  return BADGES.map((badge) => {
    const value = stats[badge.metric];
    return { badge, value, earned: value >= badge.goal };
  });
}

export type CircleRole = 'Owner' | 'Moderator' | 'Member';

export type Circle = {
  id: string;
  name: string;
  desc: string;
  gradient: string;
  members: number;
  role: CircleRole;
  privacy: 'private' | 'public';
  category: string;
  active: string;
};

export const CIRCLE_ROLES: { role: CircleRole; can: string }[] = [
  { role: 'Owner', can: 'Edit the circle, approve members, remove posts, set privacy' },
  { role: 'Moderator', can: 'Approve members, remove posts, pin posts' },
  { role: 'Member', can: 'Post, comment, react, invite (if public)' },
];

export function seedCircles(): Circle[] {
  return [
    { id: 'c1', name: 'Night Drive Club', desc: 'Synthwave, empty highways, 2am palettes.', gradient: GRADIENTS[0], members: 1284, role: 'Owner', privacy: 'private', category: 'Music', active: '2m' },
    { id: 'c2', name: 'Golden Hour Society', desc: 'One warm frame a day, no exceptions.', gradient: GRADIENTS[3], members: 6420, role: 'Member', privacy: 'public', category: 'Photography', active: '5m' },
    { id: 'c3', name: 'Analog Textures', desc: 'Grain, paper, ink and scanned mistakes.', gradient: GRADIENTS[5], members: 892, role: 'Moderator', privacy: 'public', category: 'Art', active: '1h' },
    { id: 'c4', name: 'Kitchen Lo-Fi', desc: 'Cook small, film close, keep it quiet.', gradient: GRADIENTS[2], members: 3110, role: 'Member', privacy: 'private', category: 'Food', active: '3h' },
  ];
}

export type CirclePost = { id: string; author: string; handle: string; text: string; time: string; reportState?: 'none' | 'reported' | 'removed' };

export const CIRCLE_POSTS: Record<string, CirclePost[]> = {
  c1: [
    { id: 'cp1', author: 'Nova Reyes', handle: '@nova.wav', text: 'new loop is up — the one with the rain on the windshield sample', time: '12m' },
    { id: 'cp2', author: 'Bit Boss', handle: '@bit.boss', text: 'driving it tonight with the top down (metaphorically, it is raining here)', time: '34m' },
    { id: 'cp3', author: 'Lofi Luna', handle: '@lofi.luna', text: 'pinned: circle rules — credit the original mixer, no promo drops', time: '2h' },
  ],
  c2: [{ id: 'cp4', author: 'Crumb Co', handle: '@crumb.co', text: 'caught 40 seconds of it through my kitchen window today', time: '1h' }],
  c3: [
    { id: 'cp5', author: 'Mira Sol', handle: '@mira.sol', text: 'scanned a mistake I kept — the fold is the whole point', time: '45m' },
    { id: 'cp6', author: 'Orbit Oz', handle: '@orbit.oz', text: 'someone here graded my dead pixel into a star. respect.', time: '2h' },
  ],
  c4: [{ id: 'cp7', author: 'Crumb Co', handle: '@crumb.co', text: 'soft-boiled, 6.5 minutes, filmed on the floor again', time: '5h' }],
};

export type CircleEvent = { id: string; title: string; when: string; host: string; rsvp: number };

export const CIRCLE_EVENTS: Record<string, CircleEvent[]> = {
  c1: [{ id: 'ce1', title: 'Live edit session — skyline loop', when: 'Friday 20:00', host: '@nova.wav', rsvp: 48 }],
  c2: [{ id: 'ce2', title: 'Sunrise photo walk (online)', when: 'Saturday 05:40', host: '@crumb.co', rsvp: 122 }],
  c3: [],
  c4: [{ id: 'ce3', title: 'One-pot cook-along, quiet cam only', when: 'Sunday 19:30', host: '@crumb.co', rsvp: 31 }],
};

export const CIRCLE_DISCOVERY = [
  { id: 'c5', name: 'Slow Cinema Club', desc: 'Long takes, softer cuts.', members: 2140, category: 'Film' },
  { id: 'c6', name: 'TypeNERDs', desc: 'Kerning complaints, monthly.', members: 980, category: 'Design' },
  { id: 'c7', name: 'Rain Sounds Only', desc: 'No talking, just weather.', members: 5210, category: 'Music' },
  { id: 'c8', name: 'Film Grain Farm', desc: 'Scanned, dusted, kept.', members: 640, category: 'Photography' },
];

export type CollabRevision = { id: string; author: string; at: string; note: string };

export type CollabVibe = {
  id: string;
  title: string;
  caption: string;
  gradient: string;
  mood: string;
  visibility: 'private' | 'public';
  approval: 'auto' | 'required';
  status: 'draft' | 'pending' | 'approved' | 'published';
  roles: { handle: string; role: 'Owner' | 'Editor' | 'Contributor' | 'Viewer' }[];
  presence: string[];
  revisions: CollabRevision[];
};

export const COLLAB_ROLE_CAPS: { role: 'Owner' | 'Editor' | 'Contributor' | 'Viewer'; can: string }[] = [
  { role: 'Owner', can: 'Edit everything, manage people, approve or publish' },
  { role: 'Editor', can: 'Edit caption and mood, submit for approval' },
  { role: 'Contributor', can: 'Suggest changes — Owner must approve' },
  { role: 'Viewer', can: 'Read only' },
];

export function seedCollabVibes(): CollabVibe[] {
  return [
    {
      id: 'cv1',
      title: 'Rain on the windshield',
      caption: 'the wipers kept time better than I did',
      gradient: GRADIENTS[0],
      mood: 'Nostalgic',
      visibility: 'private',
      approval: 'required',
      status: 'draft',
      roles: [
        { handle: '@you', role: 'Owner' },
        { handle: '@nova.wav', role: 'Editor' },
        { handle: '@mira.sol', role: 'Contributor' },
        { handle: '@orbit.oz', role: 'Viewer' },
      ],
      presence: ['@nova.wav'],
      revisions: [
        { id: 'r1', author: '@you', at: '2h ago', note: 'started the board' },
        { id: 'r2', author: '@nova.wav', at: '1h ago', note: 'caption: wipers line added' },
        { id: 'r3', author: '@mira.sol', at: '20m ago', note: 'suggested mood shift: Calm to Nostalgic' },
      ],
    },
    {
      id: 'cv2',
      title: 'Kitchen, 6.5 minutes',
      caption: 'soft-boiled, filmed on the floor',
      gradient: GRADIENTS[2],
      mood: 'Calm',
      visibility: 'private',
      approval: 'auto',
      status: 'pending',
      roles: [
        { handle: '@crumb.co', role: 'Owner' },
        { handle: '@you', role: 'Contributor' },
      ],
      presence: ['@crumb.co'],
      revisions: [
        { id: 'r4', author: '@crumb.co', at: '5h ago', note: 'opened the collab board' },
        { id: 'r5', author: '@you', at: '3h ago', note: 'suggested a wider crop' },
      ],
    },
  ];
}

export type MarketRole = 'Videographer' | 'Editor' | 'Sound design' | 'Motion' | 'Photographer' | 'Copywriting';

export type MarketListing = {
  id: string;
  title: string;
  poster: string;
  handle: string;
  needs: MarketRole[];
  brief: string;
  deadline: string;
  budget: string;
  status: 'open' | 'closed';
};

export function seedMarketListings(): MarketListing[] {
  return [
    {
      id: 'm1', title: 'Short film — 90s vertical cut', poster: 'Nova Reyes', handle: '@nova.wav',
      needs: ['Videographer', 'Sound design'], brief: 'Night drive piece, practical lights only. Two-day shoot, remote handoff.',
      deadline: 'Nov 14', budget: 'demo coins only', status: 'open',
    },
    {
      id: 'm2', title: 'EP visuals — 4 loops', poster: 'Lofi Luna', handle: '@lofi.luna',
      needs: ['Motion', 'Editor'], brief: 'Four seamless loops for a January release. Grain-heavy palette, no faces.',
      deadline: 'Nov 21', budget: 'demo coins only', status: 'open',
    },
    {
      id: 'm3', title: 'Café brand reel', poster: 'Crumb Co', handle: '@crumb.co',
      needs: ['Photographer', 'Copywriting'], brief: 'One morning, six dishes, one sentence of voiceover. Quiet tone.',
      deadline: 'Nov 30', budget: 'demo coins only', status: 'open',
    },
    {
      id: 'm4', title: 'Zine scan cleanup', poster: 'Mira Sol', handle: '@mira.sol',
      needs: ['Editor'], brief: 'Twelve pages, dust and despeckle, keep the mistakes.', deadline: 'Nov 8', budget: 'demo coins only', status: 'closed',
    },
  ];
}

export type MarketRequest = {
  id: string;
  listingId: string;
  title: string;
  from: string;
  role: MarketRole;
  note: string;
  status: 'sent' | 'interviewing' | 'accepted' | 'declined';
  at: string;
};

export function seedMarketRequests(): MarketRequest[] {
  return [
    { id: 'mr1', listingId: 'm1', title: 'Short film — 90s vertical cut', from: '@bit.boss', role: 'Sound design', note: 'I have the rain foley already, happy to send a test.', status: 'interviewing', at: '1d' },
    { id: 'mr2', listingId: 'm3', title: 'Café brand reel', from: '@orbit.oz', role: 'Photographer', note: 'Morning light in my kitchen is free and relentless.', status: 'sent', at: '4h' },
  ];
}

export const CREATOR_POOL: { name: string; handle: string; skills: MarketRole[]; match: number; note: string }[] = [
  { name: 'Pixel Priya', handle: '@***.priya', skills: ['Motion', 'Editor'], match: 88, note: 'loops, seamless, grain-tolerant' },
  { name: 'Bit Boss', handle: '@b***.boss', skills: ['Sound design'], match: 74, note: 'foley archive, quick turnaround' },
  { name: 'Ink Studio', handle: '@i***.studio', skills: ['Copywriting', 'Photographer'], match: 69, note: 'quiet voiceover, one-line captions' },
  { name: 'Orbit Oz', handle: '@o***.oz', skills: ['Videographer'], match: 61, note: 'practical night lighting' },
];

function hoursFromNow(h: number): string {
  const d = new Date();
  d.setHours(d.getHours() + h);
  return d.toISOString();
}

export type VadoEvent = {
  id: string;
  title: string;
  kind: 'drop' | 'live' | 'workshop';
  host: string;
  handle: string;
  desc: string;
  start: string;
  durationMin: number;
  going: number;
  capacity: number;
  gradient: string;
};

export const EVENTS: VadoEvent[] = [
  { id: 'e1', title: 'Skyline Loop — Vibe drop', kind: 'drop', host: 'Nova Reyes', handle: '@nova.wav', desc: 'A four-part night-drive drop lands all at once. Watch the first cut live.', start: hoursFromNow(2), durationMin: 20, going: 412, capacity: 800, gradient: GRADIENTS[0] },
  { id: 'e2', title: 'Golden-hour grading workshop', kind: 'workshop', host: 'Mira Sol', handle: '@mira.sol', desc: 'Bring one flat clip — leave with a grade you recognise. Live Q&A after.', start: hoursFromNow(27), durationMin: 75, going: 96, capacity: 120, gradient: GRADIENTS[3] },
  { id: 'e3', title: 'Cook small, film close (live)', kind: 'live', host: 'Crumb Co', handle: '@crumb.co', desc: 'One pot, one lens, no talking. Chat stays quiet-cam.', start: hoursFromNow(50), durationMin: 45, going: 233, capacity: 500, gradient: GRADIENTS[2] },
  { id: 'e4', title: 'Rain Sounds — seasonal drop', kind: 'drop', host: 'Lofi Luna', handle: '@lofi.luna', desc: 'The winter pack. Six loops, released together at the same minute.', start: hoursFromNow(74), durationMin: 15, going: 688, capacity: 1000, gradient: GRADIENTS[5] },
  { id: 'e5', title: 'Ask me anything: remix ethics', kind: 'live', host: 'Bit Boss', handle: '@bit.boss', desc: 'Attribution, credit and where a remix stops being yours.', start: hoursFromNow(98), durationMin: 60, going: 141, capacity: 300, gradient: GRADIENTS[1] },
];

export type SubscriptionTier = {
  id: string;
  creator: string;
  handle: string;
  gradient: string;
  name: string;
  coinsPerMonth: number;
  perks: string[];
  supporters: number;
};

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  { id: 's1', creator: 'Nova Reyes', handle: '@nova.wav', gradient: GRADIENTS[0], name: 'Signal', coinsPerMonth: 300, perks: ['Early drops 24h ahead', 'Subscriber-only mood boards', 'Name in the credits'], supporters: 214 },
  { id: 's2', creator: 'Nova Reyes', handle: '@nova.wav', gradient: GRADIENTS[0], name: 'Studio', coinsPerMonth: 900, perks: ['Everything in Signal', 'Monthly LUT pack', 'Two AI remix slots'], supporters: 58 },
  { id: 's3', creator: 'Mira Sol', handle: '@mira.sol', gradient: GRADIENTS[3], name: 'Paper Cut', coinsPerMonth: 250, perks: ['Scanned textures each week', 'Process notes'], supporters: 302 },
  { id: 's4', creator: 'Crumb Co', handle: '@crumb.co', gradient: GRADIENTS[2], name: 'Kitchen Table', coinsPerMonth: 400, perks: ['Recipe cards', 'Quiet-cam cook-alongs'], supporters: 129 },
  { id: 's5', creator: 'Lofi Luna', handle: '@lofi.luna', gradient: GRADIENTS[5], name: 'Static', coinsPerMonth: 500, perks: ['Seasonal sound packs', 'Stems for remixing'], supporters: 421 },
];

export type DigitalProduct = {
  id: string;
  title: string;
  creator: string;
  handle: string;
  kind: 'LUT pack' | 'Sound kit' | 'Preset' | 'Template' | 'Texture scan';
  coins: number;
  license: string;
  desc: string;
  gradient: string;
};

export const DIGITAL_PRODUCTS: DigitalProduct[] = [
  { id: 'd1', title: 'Night Drive LUTs', creator: 'Nova Reyes', handle: '@nova.wav', kind: 'LUT pack', coins: 600, license: 'Personal use', desc: 'Six sodium-lamp grades for footage shot after 10pm.', gradient: GRADIENTS[0] },
  { id: 'd2', title: 'Rain on Glass — foley', creator: 'Lofi Luna', handle: '@lofi.luna', kind: 'Sound kit', coins: 450, license: 'Personal use', desc: '48 field recordings, windshield and gutter edition.', gradient: GRADIENTS[5] },
  { id: 'd3', title: 'Zine Layout Template', creator: 'Mira Sol', handle: '@mira.sol', kind: 'Template', coins: 300, license: 'Personal + classroom', desc: 'Twelve spreads, fold marks kept on purpose.', gradient: GRADIENTS[3] },
  { id: 'd4', title: 'Grain Scans Vol. 2', creator: 'Mira Sol', handle: '@mira.sol', kind: 'Texture scan', coins: 250, license: 'Personal use', desc: 'High-res paper and dust, ready to overlay.', gradient: GRADIENTS[4] },
  { id: 'd5', title: 'Kitchen Close-Up Presets', creator: 'Crumb Co', handle: '@crumb.co', kind: 'Preset', coins: 350, license: 'Personal use', desc: 'Warm, low, forgiving — for tiny countertops.', gradient: GRADIENTS[2] },
  { id: 'd6', title: 'Console Hum Pack', creator: 'Bit Boss', handle: '@bit.boss', kind: 'Sound kit', coins: 0, license: 'Free — credit appreciated', desc: 'A taste: eight loops from the CRT era.', gradient: GRADIENTS[1] },
];

export type GiftItem = { id: string; name: string; coins: number; icon: 'star' | 'wave' | 'spark' | 'bolt' };

export const GIFTS: GiftItem[] = [
  { id: 'g-star', name: 'Star', coins: 50, icon: 'star' },
  { id: 'g-wave', name: 'Wave', coins: 120, icon: 'wave' },
  { id: 'g-spark', name: 'Spark', coins: 250, icon: 'spark' },
  { id: 'g-bolt', name: 'Bolt', coins: 600, icon: 'bolt' },
];

export type LiveRoom = {
  id: string;
  title: string;
  host: string;
  handle: string;
  gradient: string;
  viewers: number;
  live: boolean;
  category: string;
};

export const LIVE_ROOMS: LiveRoom[] = [
  { id: 'l1', title: 'Editing the skyline loop', host: 'Nova Reyes', handle: '@nova.wav', gradient: GRADIENTS[0], viewers: 312, live: true, category: 'Music' },
  { id: 'l2', title: 'Scanning yesterday’s mistakes', host: 'Mira Sol', handle: '@mira.sol', gradient: GRADIENTS[3], viewers: 148, live: true, category: 'Art' },
  { id: 'l3', title: 'Late set, quiet cam', host: 'Crumb Co', handle: '@crumb.co', gradient: GRADIENTS[2], viewers: 96, live: true, category: 'Food' },
  { id: 'l4', title: 'Re: remix ethics (rerun)', host: 'Bit Boss', handle: '@bit.boss', gradient: GRADIENTS[1], viewers: 41, live: false, category: 'Gaming' },
];

export const LIVE_CHAT_SEED = [
  { id: 'lc1', user: '@orbit.oz', text: 'that second drop at 0:40 🔥' },
  { id: 'lc2', user: '@lofi.luna', text: 'can you show the curve you used?' },
  { id: 'lc3', user: '@bit.boss', text: 'gifting a Star, keep going' },
];

// ---------- EXP-E: safety, AI transparency, experimentation ----------

export type SafetyGuideline = { id: string; title: string; body: string };

export const SAFETY_GUIDELINES: SafetyGuideline[] = [
  { id: 'sg1', title: 'Real feelings, no harm', body: 'Share mood and craft freely, but nothing that harasses, threatens or dehumanises another person.' },
  { id: 'sg2', title: 'Credit what is borrowed', body: 'Remixes and collabs keep permanent attribution. Do not present someone else’s work as your own.' },
  { id: 'sg3', title: 'Label AI help', body: 'Captions, drafts or reflections written with VADO AI carry an “AI-assisted” badge. Do not remove it from others’ posts.' },
  { id: 'sg4', title: 'No medical or crisis advice', body: 'Mood check-ins are creative prompts, never diagnosis. If someone is in danger, point them to local emergency resources.' },
  { id: 'sg5', title: 'Protect your own privacy', body: 'Keep circles, mood logs and drafts private by default. Never share passwords or payment credentials — this demo asks for neither.' },
];

export const REPORT_REASONS = ['Spam', 'Harassment', 'Misinformation', 'Undisclosed AI', 'Nudity', 'Other'];

export type ReportCase = { id: string; target: string; reason: string; note: string; status: 'submitted' | 'reviewing' | 'resolved' };

export const SEED_REPORTS: ReportCase[] = [
  { id: 'r-seed-1', target: 'a comment on your golden-hour Vibe', reason: 'Harassment', note: 'Repeated name-calling in replies.', status: 'resolved' },
];

export const BLOCKED_SEED = ['@***.spam-bot', '@***.impersonator'];

export type AiActivityEntry = { id: string; action: string; detail: string; time: string; surface: string };

export const AI_ACTIVITY_SEED: AiActivityEntry[] = [
  { id: 'aa1', action: 'Drafted a caption', detail: '“the light left slowly…” for your golden-hour idea', time: '2h', surface: 'Creator' },
  { id: 'aa2', action: 'Wrote a mood reflection', detail: 'Creative read of your last 5 check-ins — not medical', time: '1d', surface: 'Mood Timeline' },
  { id: 'aa3', action: 'Suggested creators', detail: 'Matched 3 collaborators by role overlap', time: '2d', surface: 'Marketplace' },
  { id: 'aa4', action: 'Translated a Vibe', detail: 'Spanish + French variants of your night-drive post', time: '3d', surface: 'Feed' },
];

export type FeatureFlag = { id: string; label: string; desc: string; defaultOn: boolean };

export const FEATURE_FLAGS: FeatureFlag[] = [
  { id: 'ff-remix', label: 'Inline remixing', desc: 'Remix a feed card without leaving the scroll.', defaultOn: true },
  { id: 'ff-voice', label: 'Voice-first assistant', desc: 'Hold-to-talk AI with on-device transcript demo.', defaultOn: true },
  { id: 'ff-circles', label: 'Community Circles', desc: 'Private groups with roles and moderation.', defaultOn: true },
  { id: 'ff-autocap', label: 'Auto-caption drafts', desc: 'AI pre-writes a caption on every new Vibe.', defaultOn: false },
  { id: 'ff-lblive', label: 'Low-latency live chat', desc: 'Faster optimistic chat in live rooms.', defaultOn: false },
];

export type Experiment = {
  id: string;
  name: string;
  hypothesis: string;
  variants: string[];
  rollout: number;
  status: 'running' | 'ramping' | 'stopped';
};

export const EXPERIMENTS: Experiment[] = [
  { id: 'ex-feed-density', name: 'Feed density', hypothesis: 'Two-column cards on tablet lift saves vs a single column.', variants: ['Single column', 'Two column'], rollout: 50, status: 'running' },
  { id: 'ex-caption-tone', name: 'Default AI tone', hypothesis: 'A warmer first-run personality increases AI adoption.', variants: ['Calm', 'Warm'], rollout: 30, status: 'ramping' },
  { id: 'ex-payout-copy', name: 'Payout confirmation copy', hypothesis: 'Plain-language confirmation reduces payout reversals.', variants: ['Technical', 'Plain'], rollout: 100, status: 'running' },
];
