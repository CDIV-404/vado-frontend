import { useMemo, useState } from 'react';
import { Download, Library, ShieldCheck, Sparkles } from 'lucide-react';
import { DIGITAL_PRODUCTS, type DigitalProduct } from '../data/mock';
import { load, save } from '../lib/store';
import { coins, spend, refund } from '../lib/wallet';
import { useToast } from '../components/Toast';
import { Chip, ConfirmModal, EmptyState, ScreenOverlay, SectionCard } from '../components/ui';

type Owned = { id: string; at: string; coins: number };

const KINDS = ['All', 'LUT pack', 'Sound kit', 'Preset', 'Template', 'Texture scan'] as const;

export function DigitalMarketScreen({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [owned, setOwned] = useState<Owned[]>(() => load<Owned[]>('digitalLibrary', []));
  const [balance, setBal] = useState<number>(() => coins());
  const [kind, setKind] = useState<(typeof KINDS)[number]>('All');
  const [confirm, setConfirm] = useState<{ product: DigitalProduct; kind: 'buy' | 'refund' } | null>(null);

  const list = useMemo(() => DIGITAL_PRODUCTS.filter((p) => kind === 'All' || p.kind === kind), [kind]);
  const has = (id: string) => owned.some((o) => o.id === id);
  const spent = owned.reduce((s, o) => s + o.coins, 0);

  const doBuy = (p: DigitalProduct) => {
    if (p.coins > balance) {
      toast('Not enough demo coins — earn some in Rewards first');
      return;
    }
    const next = [{ id: p.id, at: 'now', coins: p.coins }, ...owned];
    setOwned(next);
    save('digitalLibrary', next);
    if (p.coins > 0) {
      const bal = spend(`buy-${p.id}`, p.title, p.coins, 'purchase');
      setBal(bal);
    }
    toast(p.coins === 0 ? `Downloaded ${p.title} — free` : `Bought ${p.title} for ${p.coins.toLocaleString()} demo coins`);
  };

  const doRefund = (p: DigitalProduct) => {
    const rec = owned.find((o) => o.id === p.id);
    const next = owned.filter((o) => o.id !== p.id);
    setOwned(next);
    save('digitalLibrary', next);
    if (rec && rec.coins > 0) {
      const bal = refund(`buy-${p.id}`, `Refunded ${p.title}`, rec.coins);
      setBal(bal);
    }
    toast('Removed from library and refunded (demo)');
  };

  return (
    <ScreenOverlay title="Digital marketplace" onClose={onClose}>
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#d8f3ff]/25 bg-glass px-4 py-3">
        <span className="text-[12px] text-mist">Demo coin balance</span>
        <span className="text-[15px] font-semibold text-ink">{balance.toLocaleString()}</span>
      </div>
      <p className="mt-2 flex items-center gap-1.5 text-[11px] leading-relaxed text-mist">
        <ShieldCheck size={12} className="shrink-0 text-beam" />
        Demo transactions only — no card details, no real charge. Purchases are refundable for 14 simulated days.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <Chip key={k} active={kind === k} onClick={() => setKind(k)}>{k}</Chip>
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {list.map((p) => {
          const mine = has(p.id);
          return (
            <li key={p.id} className="overflow-hidden rounded-3xl border border-[#d8f3ff]/25 bg-glass backdrop-blur-lg">
              <div className="flex h-20 items-end p-3" style={{ background: p.gradient }} aria-hidden="true">
                <span className="rounded-full border border-white/25 bg-black/40 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">{p.kind}</span>
              </div>
              <div className="p-3.5">
                <p className="truncate text-[14px] font-semibold text-ink">{p.title}</p>
                <p className="truncate text-[11px] text-mist">{p.creator} · {p.handle}</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink">{p.desc}</p>
                <p className="mt-1.5 text-[10px] uppercase tracking-wide text-sky">{p.license}</p>
                <div className="mt-3 flex items-center gap-2">
                  <span className="text-[14px] font-bold text-beam">{p.coins === 0 ? 'Free' : `${p.coins.toLocaleString()} coins`}</span>
                  <span className="flex-1" />
                  {mine ? (
                    <button
                      type="button"
                      onClick={() => setConfirm({ product: p, kind: 'refund' })}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff]/25 bg-glass px-3.5 py-1.5 text-[11px] text-mist transition-colors hover:text-red-300"
                    >
                      Refund
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirm({ product: p, kind: 'buy' })}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff] bg-volt/25 px-4 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-volt/40"
                    >
                      {p.coins === 0 ? <Download size={12} /> : <Sparkles size={12} />} {p.coins === 0 ? 'Download' : 'Buy'}
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <SectionCard title="Your library" className="mt-5">
        {owned.length === 0 ? (
          <p className="text-[12px] text-mist">Nothing yet — bought packs and free downloads both land here.</p>
        ) : (
          <ul className="space-y-2" aria-label="Owned digital items">
            {owned.map((o) => {
              const p = DIGITAL_PRODUCTS.find((x) => x.id === o.id);
              if (!p) return null;
              return (
                <li key={o.id} className="flex items-center gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-white/5 px-3.5 py-2.5">
                  <span className="h-8 w-8 shrink-0 rounded-lg" style={{ background: p.gradient }} aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12px] text-ink">{p.title}</span>
                    <span className="block text-[11px] text-mist">{p.license}</span>
                  </span>
                  <span className="shrink-0 text-[11px] text-mist">{o.coins === 0 ? 'free' : `${o.coins.toLocaleString()} coins`}</span>
                </li>
              );
            })}
            <li className="pt-1 text-[11px] text-mist">{owned.length} item{owned.length === 1 ? '' : 's'} · {spent.toLocaleString()} demo coins spent</li>
          </ul>
        )}
      </SectionCard>

      {owned.length === 0 && (
        <div className="mt-4">
          <EmptyState icon={<Library size={24} />} title="Library is empty" body="Grab the free Console Hum Pack above to see how licensing and refunds work." />
        </div>
      )}

      <ConfirmModal
        open={confirm?.kind === 'buy'}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && doBuy(confirm.product)}
        title={confirm?.product.coins === 0 ? `Download ${confirm?.product.title}?` : `Buy ${confirm?.product.title}?`}
        body={
          confirm?.product.coins === 0
            ? `Free download. Licence: ${confirm?.product.license}. Added to your library on this device.`
            : `This debits ${confirm?.product.coins.toLocaleString()} demo coins — a simulated purchase, no real payment. Licence: ${confirm?.product.license}.`
        }
        confirmLabel={confirm?.product.coins === 0 ? 'Download' : 'Confirm purchase'}
      />
      <ConfirmModal
        open={confirm?.kind === 'refund'}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm && doRefund(confirm.product)}
        title="Refund this item?"
        body="It is removed from your library and the demo coins are returned to your balance."
        confirmLabel="Refund"
        danger
      />
    </ScreenOverlay>
  );
}
