import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Coins, Radio, Send, Sparkles, Users, Zap } from 'lucide-react';
import { GIFTS, LIVE_CHAT_SEED, LIVE_ROOMS, type GiftItem, type LiveRoom } from '../data/mock';
import { load, save } from '../lib/store';
import { coins, spend } from '../lib/wallet';
import { useToast } from '../components/Toast';
import { ConfirmModal, EmptyState, ScreenOverlay, SectionCard } from '../components/ui';

const GIFT_ICON: Record<GiftItem['icon'], React.ReactNode> = {
  star: <Sparkles size={14} />,
  wave: <Radio size={14} />,
  spark: <Zap size={14} />,
  bolt: <Zap size={14} />,
};

type ChatMsg = { id: string; user: string; text: string };

export function LiveScreen({ session, onClose }: { session: string | null; onClose: () => void }) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const me = `@${(session ?? 'you').toLowerCase().replace(/\s+/g, '.')}`;
  const [roomId, setRoomId] = useState<string | null>(null);
  const [balance, setBal] = useState<number>(() => coins());
  const [giftsSent, setGiftsSent] = useState<Record<string, number>>(() => load<Record<string, number>>('giftsSent', {}));
  const [confirm, setConfirm] = useState<GiftItem | null>(null);
  const [chat, setChat] = useState<ChatMsg[]>(LIVE_CHAT_SEED.map((c) => ({ id: c.id, user: c.user, text: c.text })));
  const [draft, setDraft] = useState('');
  const [viewers, setViewers] = useState(0);
  const feedRef = useRef<HTMLDivElement>(null);

  const room = useMemo(() => LIVE_ROOMS.find((r) => r.id === roomId) ?? null, [roomId]);

  useEffect(() => {
    if (!room) return;
    setViewers(room.viewers);
    const t = window.setInterval(() => {
      setViewers((v) => Math.max(1, v + Math.round((Math.random() - 0.45) * 6)));
    }, 2500);
    return () => window.clearInterval(t);
  }, [room]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [chat]);

  const totalGifts = Object.values(giftsSent).reduce((a, b) => a + b, 0);

  const sendGift = (g: GiftItem) => {
    if (g.coins > balance) {
      toast('Not enough demo coins for that gift');
      return;
    }
    const bal = spend(`gift-${g.id}-${Date.now()}`, `${g.name} to ${room?.host ?? 'host'}`, g.coins, 'gift');
    setBal(bal);
    const next = { ...giftsSent, [g.id]: (giftsSent[g.id] ?? 0) + 1 };
    setGiftsSent(next);
    save('giftsSent', next);
    setChat((c) => [...c, { id: `g${Date.now()}`, user: me, text: `sent ${g.name} ✨` }]);
    setConfirm(null);
    toast(`${g.name} sent — ${g.coins.toLocaleString()} demo coins`);
  };

  if (room) {
    return (
      <ScreenOverlay title={room.title} onClose={() => setRoomId(null)}>
        <div className="relative flex h-44 items-center justify-center overflow-hidden rounded-3xl border border-[#d8f3ff]/25" style={{ background: room.gradient }}>
          {room.live && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-red-400/50 bg-red-500/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
              <span className={`h-1.5 w-1.5 rounded-full bg-white ${reduce ? '' : 'animate-pulse'}`} /> Live
            </span>
          )}
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-medium text-white">
            <Users size={12} /> {viewers.toLocaleString()}
          </span>
          <div className="text-center">
            <p className="text-[15px] font-semibold text-white drop-shadow">{room.host}</p>
            <p className="text-[12px] text-white/80">{room.handle} · {room.category}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between rounded-2xl border border-[#d8f3ff]/25 bg-glass px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[12px] text-mist"><Coins size={13} /> Demo balance</span>
          <span className="text-[14px] font-semibold text-ink">{balance.toLocaleString()}</span>
        </div>

        <SectionCard title="Send a gift" className="mt-3">
          <p className="mb-3 text-[11px] leading-relaxed text-mist">
            Gifts are demo coins only — no real money. {totalGifts > 0 ? `You have sent ${totalGifts} gift${totalGifts === 1 ? '' : 's'} in this session.` : 'Pick one to cheer the host on.'}
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {GIFTS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setConfirm(g)}
                className="flex flex-col items-center gap-1 rounded-2xl border border-[#d8f3ff]/25 bg-white/5 px-2 py-3 text-center transition-colors hover:border-beam/60 hover:bg-volt/10"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-beam/30 bg-volt/15 text-beam">{GIFT_ICON[g.icon]}</span>
                <span className="text-[12px] font-semibold text-ink">{g.name}</span>
                <span className="text-[10px] text-mist">{g.coins.toLocaleString()} coins</span>
                {giftsSent[g.id] ? <span className="text-[9px] uppercase tracking-wide text-beam">×{giftsSent[g.id]}</span> : null}
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Live chat" className="mt-3">
          <div ref={feedRef} className="scroll-slim max-h-44 space-y-2 overflow-y-auto pr-1" aria-live="polite">
            {chat.map((m) => (
              <motion.p
                key={m.id}
                initial={reduce ? undefined : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="text-[12px] leading-snug"
              >
                <span className={m.user === me ? 'font-semibold text-beam' : 'font-semibold text-ink'}>{m.user}</span>{' '}
                <span className="text-mist">{m.text}</span>
              </motion.p>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = draft.trim();
              if (!text) return;
              setChat((c) => [...c, { id: `m${Date.now()}`, user: me, text: text.slice(0, 120) }]);
              setDraft('');
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 120))}
              aria-label="Chat message"
              placeholder="Say something kind…"
              className="min-w-0 flex-1 rounded-full border border-[#d8f3ff]/30 bg-deep px-4 py-2 text-[13px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
            />
            <button
              type="submit"
              aria-label="Send chat message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#d8f3ff] bg-volt/25 text-white transition-colors hover:bg-volt/40"
            >
              <Send size={14} />
            </button>
          </form>
        </SectionCard>

        <ConfirmModal
          open={!!confirm}
          onClose={() => setConfirm(null)}
          onConfirm={() => confirm && sendGift(confirm)}
          title={`Send ${confirm?.name} to ${room.host}?`}
          body={`This spends ${confirm?.coins.toLocaleString()} demo coins from your balance. It is a simulated gift — no real payment, and it is not reversible.`}
          confirmLabel="Send gift"
        />
      </ScreenOverlay>
    );
  }

  return (
    <ScreenOverlay title="Live now" onClose={onClose}>
      <p className="text-[12px] text-mist">Rooms creators are broadcasting right now. Viewer counts and gifts are simulated on this device.</p>
      <ul className="mt-4 space-y-2.5">
        {LIVE_ROOMS.map((r: LiveRoom) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setRoomId(r.id)}
              className="flex w-full items-center gap-3.5 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3.5 py-3 text-left backdrop-blur-lg transition-colors hover:border-beam/60"
            >
              <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl" style={{ background: r.gradient }} aria-hidden="true">
                {r.live && (
                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-red-500/85 px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">
                    <span className={`h-1 w-1 rounded-full bg-white ${reduce ? '' : 'animate-pulse'}`} /> Live
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-ink">{r.title}</span>
                <span className="block truncate text-[11px] text-mist">{r.host} · {r.handle} · {r.category}</span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[13px] font-semibold text-beam">{r.viewers.toLocaleString()}</span>
                <span className="block text-[10px] uppercase tracking-wide text-mist">{r.live ? 'watching' : 'rerun'}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      {LIVE_ROOMS.every((r) => !r.live) && (
        <EmptyState icon={<Radio size={26} />} title="No one is live" body="Check Events & Drops for the next scheduled broadcast." />
      )}
      <SectionCard title="Your gifting" className="mt-5">
        <p className="text-[12px] leading-relaxed text-mist">
          {totalGifts > 0
            ? `You have sent ${totalGifts} demo gift${totalGifts === 1 ? '' : 's'}. Gifts never convert to real money and stay on this device.`
            : 'You have not sent a gift yet. Enter a room and cheer a creator on with demo coins.'}
        </p>
      </SectionCard>
    </ScreenOverlay>
  );
}
