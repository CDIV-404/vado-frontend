export type AiQuickAction = {
  label: string;
  kind: 'create' | 'copy' | 'save' | 'navigate';
  target?: string;
};

export type AiReply = {
  text: string;
  actions: AiQuickAction[];
};

export type AiPersonality =
  | 'calm' | 'playful' | 'poetic' | 'direct' | 'coach' | 'curious' | 'wit' | 'minimal' | 'warm' | 'custom';

export function personalityLine(id: AiPersonality, custom?: string): string {
  if (id === 'custom') return custom?.trim() || 'Right now you are free to phrase things however you like.';
  const map: Record<Exclude<AiPersonality, 'custom'>, string> = {
    calm: 'I keep things calm and unhurried — lowercase energy, one grounding line.',
    playful: 'Playful mode engaged — short, punchy, a little sparkly.',
    poetic: 'Poetic mode: every answer carries one small image.',
    direct: 'Direct mode. The answer first, one next step, no filler.',
    coach: 'Coach mode: you will leave every reply with a plan and a nudge.',
    curious: 'Curious mode — I will ask what is underneath the question.',
    wit: 'Witty mode. Dry, affectionate, mildly unhinged.',
    minimal: 'Minimal. Words: few.',
    warm: 'Warm mode — glad you are here, friend.',
  };
  return map[id];
}

function applyTone(id: AiPersonality, text: string, custom?: string): string {
  switch (id) {
    case 'playful':
      return `${text}\n\n✨ want a spicier or softer take?`;
    case 'poetic':
      return `${text}\n\n(consider this draft hummed, not typed.)`;
    case 'direct': {
      const first = text.split('\n\n')[0];
      return `${first}\n\nNext step: act on the line above.`;
    }
    case 'coach':
      return `${text}\n\nYour move today: pick one line above and ship it in under 10 minutes.`;
    case 'curious':
      return `${text}\n\nCurious — what made you reach for this right now?`;
    case 'wit':
      return `${text}\n\n(That was the good option. The other ones had vibes of their own, but not good ones.)`;
    case 'minimal': {
      const sentence = text.split(/(?<=[.!?])\s/)[0] ?? text;
      return sentence.length > 120 ? `${sentence.slice(0, 117)}…` : sentence;
    }
    case 'warm':
      return `${text}\n\nWhatever you choose with this, it will be the right choice — you have good instincts.`;
    case 'custom':
      return custom?.trim() ? `${text}\n\n(shaped by your custom mode: ${custom.trim()})` : text;
    default:
      return text;
  }
}

const CAPTIONS = [
  'city lights, low frequencies — the night writes the captions for me 🌃',
  'golden hour hits different when nobody is watching',
  'soft static, warm tea, low battery, high heart',
  'made this in the margins of a busy day. keeping it.',
];

const IDEAS = [
  'A 15-second loop of your desk at night with one moving light source.',
  '“Things I almost posted” — a carousel of near-miss vibes.',
  'Remix a stranger’s caption into a mood and credit them.',
];

const BIO_LINES = [
  'short, lowercase, one concrete thing + one abstract thing. e.g. “night shoots 🌃 quiet frequencies”',
  'lead with what you make, not what you like. “building calm visuals” beats “I like calm visuals”',
  'one line of wit, one line of proof. e.g. “90% cat on keyboard, 10% mixing”',
];

const MOOD_KEYWORDS: Record<string, string[]> = {
  calm: ['calm', 'quiet', 'soft', 'peaceful', 'relax', 'sleep', 'tonight'],
  energetic: ['energy', 'hype', 'excited', 'fast', 'gym', 'dance'],
  nostalgic: ['nostalgic', 'memory', 'old', '90s', 'throwback', 'miss'],
  focused: ['focus', 'study', 'work', 'deep', 'mode'],
};

function detectMood(input: string): string | null {
  const low = input.toLowerCase();
  for (const [mood, keys] of Object.entries(MOOD_KEYWORDS)) {
    if (keys.some((k) => low.includes(k))) return mood;
  }
  return null;
}

function pick<T>(arr: T[], seed: string): T {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return arr[h % arr.length];
}

function vadoReplyBase(input: string): AiReply {
  const low = input.toLowerCase();
  const mood = detectMood(low);

  if (low.includes('caption') && (low.includes('improve') || low.includes('better') || low.includes('poetic'))) {
    return {
      text: 'Here is a more poetic take:\n\n“the light left slowly, like it was also afraid of the quiet.”\n\nWant it warmer, sadder, or shorter?',
      actions: [
        { label: 'Copy caption', kind: 'copy' },
        { label: 'Use in a Vibe', kind: 'create' },
      ],
    };
  }

  if (low.includes('caption')) {
    const base = mood ? `Lean ${mood}: ` : '';
    return {
      text: `${base}${pick(CAPTIONS, input)}\n\nTwo alternates are queued if you want variations.`,
      actions: [
        { label: 'Copy caption', kind: 'copy' },
        { label: 'Create a Vibe from this', kind: 'create' },
        { label: 'More options', kind: 'save' },
      ],
    };
  }

  if (low.includes('create a vibe') || low.includes('new vibe') || (low.includes('vibe') && low.includes('create'))) {
    return {
      text: mood
        ? `Nice — I can seed a ${mood} Vibe for you: mood card, one-line caption, and two hashtags. Open the creator and I will pre-fill it.`
        : 'Let us build one. Tell me a mood (calm, chaotic, inspired…) or pick a category and I will pre-fill the creator.',
      actions: [
        { label: 'Open the creator', kind: 'create' },
        { label: 'Give me ideas first', kind: 'save' },
      ],
    };
  }

  if (low.includes('post today') || low.includes('what should i post') || low.includes('idea')) {
    return {
      text: `Three ideas trending with your interests:\n\n1. ${IDEAS[0]}\n2. ${IDEAS[1]}\n3. ${IDEAS[2]}\n\n${mood ? `I would open with the ${mood} angle today.` : 'Want me to expand any of these?'}`,
      actions: [
        { label: 'Create idea #1', kind: 'create' },
        { label: 'Save list', kind: 'save' },
      ],
    };
  }

  if (low.includes('bio')) {
    return {
      text: `Bio rewrite:\n\n${pick(BIO_LINES, input)}\n\nPaste it into Profile → Edit, or ask me for a funny or minimalist version.`,
      actions: [
        { label: 'Copy bio', kind: 'copy' },
        { label: 'Go to Profile', kind: 'navigate', target: 'profile' },
      ],
    };
  }

  if (low.includes('analytic') || low.includes('stat') || low.includes('reach') || low.includes('growth')) {
    return {
      text: 'Your last 7 days: views +18%, saves +6%, but comments flat. Saving is high and comments low usually means the mood lands but the caption does not invite a reply. Try ending captions with an open question.',
      actions: [
        { label: 'Rewrite a caption', kind: 'save' },
        { label: 'Open Views', kind: 'navigate', target: 'views' },
      ],
    };
  }

  if (low.includes('reward') || low.includes('earn') || low.includes('bonus')) {
    return {
      text: 'Earning more, concretely: post 3x this week to keep the Creative Streak (250 demo coins), and replies within 1h boost the engagement bonus tier. Referral rewards release after the friend posts their first Vibe.',
      actions: [
        { label: 'Copy a streak plan', kind: 'copy' },
        { label: 'Create a Vibe', kind: 'create' },
      ],
    };
  }

  if (low.includes('referral') || low.includes('invite') || low.includes('friend join')) {
    return {
      text: `Friendly referral copy:\n\n“found this weird calm corner of the internet — come vibe with me, it takes 20 seconds and no password drama.”\n\nKept it honest, no spam angle.`,
      actions: [
        { label: 'Copy invite', kind: 'copy' },
        { label: 'Shorter version', kind: 'save' },
      ],
    };
  }

  if (low.includes('mood') || low.includes('check-in') || low.includes('check in') || low.includes('timeline')) {
    return {
      text: 'Your Mood Timeline is private by default — nothing there ever reaches feeds or analytics. Log today in one tap, and I will read the pattern creatively (never as advice about your health).',
      actions: [
        { label: 'Open Mood Timeline', kind: 'navigate', target: 'mood' },
        { label: 'Suggest a mood caption', kind: 'save' },
      ],
    };
  }

  if (low.includes('translat')) {
    return {
      text: 'I can translate a Vibe into any of the 18 supported languages (Spanish, Japanese, Arabic…). Translations publish with the original caption, and you can apply auto-translate to future posts.',
      actions: [
        { label: 'Translate current Vibe', kind: 'create' },
        { label: 'Enable auto-translate', kind: 'navigate', target: 'settings' },
      ],
    };
  }

  if (low.includes('live') || low.includes('stream')) {
    return {
      text: 'Live summary: Nova’s session “Editing the skyline loop” peaked at 1.2K viewers. Best moment was the before/after grade at 41:00. Want a short clip suggestion from that moment?',
      actions: [
        { label: 'Clip idea', kind: 'create' },
        { label: 'Browse live rooms', kind: 'navigate', target: 'vibes' },
      ],
    };
  }

  if (low.includes('gift') || low.includes('wallet') || low.includes('coin')) {
    return {
      text: 'Demo wallet only — no real payment data. You have a virtual coin balance you can send as Stars in live rooms. Payouts are simulated and always ask for confirmation first.',
      actions: [
        { label: 'Open wallet', kind: 'navigate', target: 'settings' },
      ],
    };
  }

  if (low.includes('help') || low.includes('what can you do')) {
    return {
      text: 'I write captions, seed Vibe drafts, rewrite your bio, read your analytics, plan reward streaks, draft referral copy, translate posts, and summarize lives. Ask in plain words — I will pick the lane.',
      actions: [
        { label: 'Write a caption', kind: 'save' },
        { label: 'Create a Vibe', kind: 'create' },
      ],
    };
  }

  const fallbackMood = mood ? ` ${mood} it is.` : '';
  return {
    text: `Got it.${fallbackMood} Here is where I would take that: ${pick(CAPTIONS, input + 'x')} — or I can turn your words straight into a Vibe draft.`,
    actions: [
      { label: 'Create a Vibe from this', kind: 'create' },
      { label: 'Suggest something else', kind: 'save' },
    ],
  };
}

export function vadoReply(
  input: string,
  personality: AiPersonality = 'calm',
  customInstruction?: string
): AiReply {
  const base = vadoReplyBase(input);
  return { text: applyTone(personality, base.text, customInstruction), actions: base.actions };
}

export function moodReflection(entries: { date: string; mood: string }[]): string {
  if (entries.length === 0) {
    return 'No check-ins yet. When you log a few moods, I will read them like a palette — patterns, shifts, and one small creative prompt to answer them with.';
  }
  const counts = new Map<string, number>();
  for (const e of entries) counts.set(e.mood, (counts.get(e.mood) ?? 0) + 1);
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  const second = sorted[1]?.[0] ?? top[0];
  const recent = entries.slice(-5);
  const recentTop = [...recent.reduce((m, e) => m.set(e.mood, (m.get(e.mood) ?? 0) + 1), new Map<string, number>())]
    .sort((a, b) => b[1] - a[1])[0][0];
  return `Over ${entries.length} check-ins, ${top[0].toLowerCase()} was your most-frequent color (${top[1]} days), often right next to ${second.toLowerCase()}. The last five lean ${recentTop.toLowerCase()}. Read creatively, not clinically: a streak of ${recentTop.toLowerCase()} usually asks for slower cuts, darker grades and shorter captions. Try posting one quiet frame instead of explaining the feeling.`;
}

export function greeting(name: string | null, personality: AiPersonality = 'calm', customInstruction?: string): AiReply {
  const base: AiReply = {
    text: `Hey${name ? ` ${name}` : ''} — I am VADO AI. Ask me for a caption, a Vibe draft, a bio rewrite, or a read on your stats.`,
    actions: [],
  };
  return { text: applyTone(personality, base.text, customInstruction), actions: [] };
}
