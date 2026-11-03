import { useState } from 'react';
import { Banknote, CheckCircle2, Coins, RotateCcw, Sparkles } from 'lucide-react';
import { CAMPAIGNS, DEFAULT_COINS, DEMO_PAYOUT_ACCOUNT, REWARD_HISTORY } from '../data/mock';
import { load, save } from '../lib/store';
import { useToast } from '../components/Toast';
import { ProgressRing } from '../components/charts';
import { ConfirmModal, SectionCard, ScreenOverlay } from '../components/ui';

type Payout = { id: string; coins: number; time: string; status: 'pending' | 'paid' };

export function RewardsScreen({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [coins, setCoins] = useState<number>(() => load<number>('coins', DEFAULT_COINS));
  const [claimed, setClaimed] = useState<string[]>(() => load<string[]>('claimedCampaigns', []));
  const [payouts, setPayouts] = useState<Payout[]>(() => load<Payout[]>('payouts', []));
  const [confirmPayout, setConfirmPayout] = useState(false);
  const [confirmReverse, setConfirmReverse] = useState<string | null>(null);

  const claim = (id: string, reward: number, name: string) => {
    const next = [...claimed, id];
    save('claimedCampaigns', next);
    setClaimed(next);
    const bal = coins + reward;
    save('coins', bal);
    setCoins(bal);
    toast(`+${reward} demo coins — ${name}`);
  };

  const requestPayout = () => {
    if (coins < 1000) {
      toast('Minimum demo payout is 1,000 coins');
      return;
    }
    setConfirmPayout(true);
  };

  const doPayout = () => {
    const p: Payout = { id: `p${Date.now()}`, coins, time: 'now', status: 'pending' };
    const next = [p, ...payouts];
    save('payouts', next);
    setPayouts(next);
    save('coins', 0);
    setCoins(0);
    toast(`Payout of ${p.coins.toLocaleString()} demo coins scheduled (${DEMO_PAYOUT_ACCOUNT})`);
  };

  const reverse = (id: string) => {
    const p = payouts.find((x) => x.id === id);
    if (!p) return;
    const next = payouts.map((x) => (x.id === id ? { ...x, status: 'paid' as const } : x));
    save('payouts', next);
    setPayouts(next);
    const bal = coins + p.coins;
    save('coins', bal);
    setCoins(bal);
    toast('Payout reversed — coins returned');
  };

  const history = [
    ...payouts.map((p) => ({
      id: p.id,
      label: `Demo payout requested`,
      coins: -p.coins,
      time: p.time,
      status: p.status === 'pending' ? ('pending' as const) : ('completed' as const),
    })),
    ...REWARD_HISTORY,
  ];

  return (
    <ScreenOverlay title="Rewards & monetization" onClose={onClose}>
      <div className="rounded-3xl border border-beam/40 bg-gradient-to-br from-volt/25 to-transparent p-5 shadow-glow">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-beam">
          <Coins size={13} /> Demo coin balance
        </p>
        <p className="mt-2 text-[34px] font-bold leading-none text-ink">{coins.toLocaleString()}</p>
        <p className="mt-2 text-[11px] leading-relaxed text-mist">
          Virtual coins only. No real currency, no payment credentials. {DEMO_PAYOUT_ACCOUNT}.
        </p>
        <div className="mt-4 flex gap-2.5">
          <button
            type="button"
            onClick={requestPayout}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff] bg-volt/25 px-5 py-2.5 text-[13px] font-semibold text-white shadow-glow-in transition-colors hover:bg-volt/40"
          >
            <Banknote size={14} /> Request payout
          </button>
          <span className="self-end text-[11px] text-mist">min 1,000 · scheduled Fridays</span>
        </div>
      </div>

      <SectionCard title="Active campaigns" className="mt-4">
        <ul className="space-y-3">
          {CAMPAIGNS.map((c) => {
            const pct = (c.progress / c.goal) * 100;
            const done = c.progress >= c.goal;
            const isClaimed = claimed.includes(c.id);
            return (
              <li key={c.id} className="flex items-center gap-3.5 rounded-2xl border border-[#d8f3ff]/20 bg-white/5 p-3">
                <ProgressRing pct={pct} label={`${c.name}: ${c.progress} of ${c.goal}`} />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink">{c.name}</p>
                  <p className="mt-0.5 text-[12px] text-mist">{c.desc}</p>
                  <p className="mt-1 text-[11px] text-sky">
                    {c.progress}/{c.goal} · +{c.reward} coins · {c.ends}
                  </p>
                </div>
                {isClaimed ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-beam">
                    <CheckCircle2 size={14} /> Claimed
                  </span>
                ) : (
                  <button
                    type="button"
                    disabled={!done}
                    onClick={() => claim(c.id, c.reward, c.name)}
                    className="rounded-full border border-[#d8f3ff]/40 bg-volt/20 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-volt/35 disabled:opacity-35"
                  >
                    Claim
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Reward history" className="mt-4">
        <ul className="divide-y divide-[#d8f3ff]/10">
          {history.map((h) => (
            <li key={h.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className={`flex h-8 w-8 items-center justify-center rounded-xl border ${
                h.status === 'reversed'
                  ? 'border-red-400/40 bg-red-500/10 text-red-300'
                  : h.status === 'pending'
                    ? 'border-beam/40 bg-volt/10 text-beam'
                    : 'border-[#d8f3ff]/25 bg-white/5 text-mist'
              }`}>
                {h.status === 'reversed' ? <RotateCcw size={14} /> : h.status === 'pending' ? <Sparkles size={14} /> : <CheckCircle2 size={14} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-ink">{h.label}</span>
                <span className="block text-[11px] text-mist">
                  {h.time} · {h.status}
                  {h.id.startsWith('p') && h.status === 'pending' ? ' · reversible' : ''}
                </span>
              </span>
              <span className={`text-[13px] font-semibold ${h.coins < 0 ? 'text-red-300' : 'text-beam'}`}>
                {h.coins > 0 ? '+' : ''}{h.coins.toLocaleString()}
              </span>
              {h.id.startsWith('p') && h.status === 'pending' && (
                <button
                  type="button"
                  aria-label="Reverse this payout"
                  onClick={() => setConfirmReverse(h.id)}
                  className="rounded-full border border-[#d8f3ff]/25 p-1.5 text-mist transition-colors hover:text-red-300"
                >
                  <RotateCcw size={13} />
                </button>
              )}
            </li>
          ))}
        </ul>
      </SectionCard>

      <ConfirmModal
        open={confirmPayout}
        onClose={() => setConfirmPayout(false)}
        onConfirm={doPayout}
        title="Request demo payout?"
        body={`This schedules a simulated transfer of ${coins.toLocaleString()} demo coins to ${DEMO_PAYOUT_ACCOUNT}. No real money moves and no payment details are needed. Continue?`}
        confirmLabel="Request payout"
      />
      <ConfirmModal
        open={!!confirmReverse}
        onClose={() => setConfirmReverse(null)}
        onConfirm={() => confirmReverse && reverse(confirmReverse)}
        title="Reverse this payout?"
        body="The scheduled demo payout will be cancelled and the coins returned to your balance."
        confirmLabel="Reverse payout"
        danger
      />
    </ScreenOverlay>
  );
}
