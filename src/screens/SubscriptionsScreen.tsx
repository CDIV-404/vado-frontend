import { useMemo, useState } from 'react';
import { Check, CreditCard, Gem, Heart, ShieldOff, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_TIERS, type SubscriptionTier } from '../data/mock';
import { load, save } from '../lib/store';
import { coins, spend, refund } from '../lib/wallet';
import { useToast } from '../components/Toast';
import { ConfirmModal, EmptyState, ScreenOverlay, SectionCard } from '../components/ui';

type Sub = { id: string; since: string; next: string };

function monthFromNow(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

export function SubscriptionsScreen({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [subs, setSubs] = useState<Sub[]>(() => load<Sub[]>('subscriptions', []));
  const [balance, setBal] = useState<number>(() => coins());
  const [confirm, setConfirm] = useState<{ tier: SubscriptionTier; kind: 'sub' | 'cancel' } | null>(null);

  const locale = useMemo(() => (typeof navigator !== 'undefined' ? navigator.language : 'en-US'), []);
  const fmt = useMemo(() => new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }), [locale]);

  const byCreator = useMemo(() => {
    const map = new Map<string, { creator: string; handle: string; gradient: string; tiers: SubscriptionTier[] }>();
    for (const t of SUBSCRIPTION_TIERS) {
      const g = map.get(t.handle) ?? { creator: t.creator, handle: t.handle, gradient: t.gradient, tiers: [] };
      g.tiers.push(t);
      map.set(t.handle, g);
    }
    return [...map.values()];
  }, []);

  const active = (id: string) => subs.some((s) => s.id === id);
  const monthly = subs.reduce((sum, s) => sum + (SUBSCRIPTION_TIERS.find((t) => t.id === s.id)?.coinsPerMonth ?? 0), 0);

  const doSubscribe = (tier: SubscriptionTier) => {
    if (balance < tier.coinsPerMonth) {
      toast('Not enough demo coins — claim a campaign reward in Rewards');
      return;
    }
    const next = [...subs, { id: tier.id, since: new Date().toISOString(), next: monthFromNow() }];
    setSubs(next);
    save('subscriptions', next);
    const bal = spend(`sub-${tier.id}`, `Support ${tier.creator} · ${tier.name}`, tier.coinsPerMonth, 'subscription');
    setBal(bal);
    toast(`Now supporting ${tier.creator} (${tier.name}) — demo coins`);
  };

  const doCancel = (tierId: string) => {
    const s = subs.find((x) => x.id === tierId);
    const tier = SUBSCRIPTION_TIERS.find((t) => t.id === tierId);
    const next = subs.filter((x) => x.id !== tierId);
    setSubs(next);
    save('subscriptions', next);
    if (s && tier) {
      const bal = refund(`sub-${tierId}`, `Refunded ${tier.creator} · ${tier.name}`, tier.coinsPerMonth);
      setBal(bal);
    }
    toast('Support cancelled — coins refunded (demo)');
  };

  return (
    <ScreenOverlay title="Support a creator" onClose={onClose}>
      <div className="flex items-center justify-between rounded-2xl border border-[#d8f3ff]/25 bg-glass px-4 py-3">
        <span className="text-[12px] text-mist">Monthly demo spend</span>
        <span className="text-[15px] font-semibold text-ink">{monthly.toLocaleString()} coins</span>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-mist">
        Tiers are paid in demo coins from your balance ({balance.toLocaleString()}). No card, no real charge, cancel any time for a full demo refund.
      </p>

      {byCreator.map((c) => (
        <SectionCard key={c.handle} title={c.creator} className="mt-4">
          <div className="space-y-2.5">
            {c.tiers.map((t) => {
              const on = active(t.id);
              const sub = subs.find((s) => s.id === t.id);
              return (
                <div key={t.id} className={`rounded-2xl border p-3.5 transition-colors ${on ? 'border-beam/50 bg-volt/10' : 'border-[#d8f3ff]/20 bg-white/5'}`}>
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-white" style={{ background: t.gradient }} aria-hidden="true">
                      <Gem size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-ink">{t.name}</p>
                      <p className="text-[11px] text-mist">{t.supporters.toLocaleString()} supporting</p>
                    </div>
                    <span className="shrink-0 text-right">
                      <span className="block text-[14px] font-bold text-beam">{t.coinsPerMonth.toLocaleString()}</span>
                      <span className="block text-[10px] uppercase tracking-wide text-mist">coins / mo</span>
                    </span>
                  </div>
                  <ul className="mt-2.5 space-y-1">
                    {t.perks.map((p) => (
                      <li key={p} className="flex items-center gap-1.5 text-[12px] text-ink">
                        <Check size={12} className="shrink-0 text-beam" /> {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3">
                    {on ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-[11px] text-beam">
                          <Heart size={12} /> Supporting · renews {sub ? fmt.format(new Date(sub.next)) : ''}
                        </span>
                        <span className="flex-1" />
                        <button
                          type="button"
                          onClick={() => setConfirm({ tier: t, kind: 'cancel' })}
                          className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff]/25 bg-glass px-3.5 py-1.5 text-[11px] text-mist transition-colors hover:text-red-300"
                        >
                          <ShieldOff size={12} /> Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirm({ tier: t, kind: 'sub' })}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-[#d8f3ff] bg-volt/25 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-volt/40"
                      >
                        <Sparkles size={13} /> Support with {t.coinsPerMonth.toLocaleString()} coins
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ))}

      {subs.length === 0 && (
        <EmptyState icon={<CreditCard size={26} />} title="No active support yet" body="Pick a tier above. It renews monthly in demo coins until you cancel." />
      )}

      <ConfirmModal
        open={confirm?.kind === 'sub'}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && doSubscribe(confirm.tier)}
        title={`Support ${confirm?.tier.creator} — ${confirm?.tier.name}?`}
        body={`This debits ${confirm?.tier.coinsPerMonth.toLocaleString()} demo coins from your balance and renews monthly. It is a simulated subscription — no real payment is taken.`}
        confirmLabel="Confirm support"
      />
      <ConfirmModal
        open={confirm?.kind === 'cancel'}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && doCancel(confirm.tier.id)}
        title="Cancel this support?"
        body="Renewal stops and this month’s demo coins are refunded to your balance. You can support again later."
        confirmLabel="Cancel support"
        danger
      />
    </ScreenOverlay>
  );
}
