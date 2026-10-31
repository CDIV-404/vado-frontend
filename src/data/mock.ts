export type Vibe = {
  id: string;
  creator: string;
  handle: string;
  caption: string;
  gradient: string;
  category: string;
  views: string;
  likes: string;
};

export const GLOBAL_VIBES: Vibe[] = [
  {
    id: 'g1',
    creator: 'nova.wav',
    handle: '@nova.wav',
    caption: 'midnight skyline loop 🌃',
    gradient: 'linear-gradient(135deg,#0b3a6b,#1687ff 55%,#38c9ff)',
    category: 'Travel',
    views: '12.4K',
    likes: '2.1K',
  },
  {
    id: 'g2',
    creator: 'pixel.poa',
    handle: '@pixel.poa',
    caption: 'neon rain on glass — sound on 🔊',
    gradient: 'linear-gradient(135deg,#123c50,#1f8a70 60%,#a7f3d0)',
    category: 'Oddly Satisfying',
    views: '48.9K',
    likes: '9.7K',
  },
  {
    id: 'g3',
    creator: 'lofi.luna',
    handle: '@lofi.luna',
    caption: 'made this beat in 20 minutes',
    gradient: 'linear-gradient(135deg,#1e1b4b,#6d28d9 55%,#38c9ff)',
    category: 'Music',
    views: '7.2K',
    likes: '1.4K',
  },
  {
    id: 'g4',
    creator: 'crumb.co',
    handle: '@crumb.co',
    caption: 'the cheese pull heard round the world 🧀',
    gradient: 'linear-gradient(135deg,#78350f,#f59e0b 60%,#fde68a)',
    category: 'Food',
    views: '103K',
    likes: '18.2K',
  },
  {
    id: 'g5',
    creator: 'ink.studio',
    handle: '@ink.studio',
    caption: 'ink drying timelapse, weirdly calm',
    gradient: 'linear-gradient(135deg,#0f172a,#334155 55%,#94a3b8)',
    category: 'Art',
    views: '22.6K',
    likes: '5.3K',
  },
  {
    id: 'g6',
    creator: 'orbit.oz',
    handle: '@orbit.oz',
    caption: 'satellite pass over the desert 🛰️',
    gradient: 'linear-gradient(135deg,#082f49,#0ea5e9 60%,#e0f2fe)',
    category: 'Science',
    views: '61.8K',
    likes: '12.9K',
  },
];

export const FOLLOWING_VIBES: Vibe[] = GLOBAL_VIBES.slice(0, 3);

export type Interest = { emoji: string; label: string };

export const INTERESTS: Interest[] = [
  { emoji: '🐾', label: 'Animals' },
  { emoji: '😂', label: 'Comedy' },
  { emoji: '✈️', label: 'Travel' },
  { emoji: '🍔', label: 'Food' },
  { emoji: '🏀', label: 'Sports' },
  { emoji: '💄', label: 'Beauty & Style' },
  { emoji: '🎨', label: 'Art' },
  { emoji: '🎮', label: 'Gaming' },
  { emoji: '🔬', label: 'Science & Education' },
  { emoji: '💃', label: 'Dance' },
  { emoji: '✂️', label: 'DIY' },
  { emoji: '🏍️', label: 'Auto' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '💡', label: 'Life Hacks' },
  { emoji: '✨', label: 'Oddly Satisfying' },
  { emoji: '🌿', label: 'Outdoors' },
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
    id: 'c1',
    name: 'nova.wav',
    avatar: 'linear-gradient(135deg,#1687ff,#38c9ff)',
    last: 'sending the raw clips now 🎥',
    time: '2m',
    unread: 2,
    messages: [
      { from: 'them', text: 'yo did you see the skyline loop?' },
      { from: 'me', text: 'yeah the color grade is unreal' },
      { from: 'them', text: 'sending the raw clips now 🎥' },
    ],
  },
  {
    id: 'c2',
    name: 'lofi.luna',
    avatar: 'linear-gradient(135deg,#6d28d9,#38c9ff)',
    last: 'track drops friday 🎧',
    time: '1h',
    unread: 0,
    messages: [
      { from: 'me', text: 'can I remix the second verse?' },
      { from: 'them', text: 'track drops friday 🎧' },
    ],
  },
  {
    id: 'c3',
    name: 'crumb.co',
    avatar: 'linear-gradient(135deg,#f59e0b,#ef4444)',
    last: 'the cheese pull was 4K or it didn’t happen',
    time: '3h',
    unread: 1,
    messages: [
      { from: 'them', text: 'the cheese pull was 4K or it didn’t happen' },
    ],
  },
];

export const AI_REPLIES = [
  'Here are three vibes trending with your interests — want me to queue them?',
  'I can remix that caption: “city lights, low frequencies”. Use it?',
  'Golden hour hits different on this one. Try the “beam” filter?',
  'Noted — I’ll show you more of this tomorrow morning.',
];

export const VOICE_TRANSCRIPT = '“find me something calm for tonight”';
