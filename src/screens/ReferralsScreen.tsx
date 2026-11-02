import { useState } from 'react';
import { Check, Copy, Gift, Link2, Sparkles, UserPlus } from 'lucide-react';
import { REFERRALS, REFERRAL_CODE, REFERRAL_TIERS, fmt } from '../data/mock';
import { vadoReply } from '../lib/ai';
import { useToast } from '../components/Toast';
import { ProgressRing } from '../components/charts';
import { SectionCard, ScreenOverlay } from '../components/ui';

const STATUS_META: Record<string, { label: string; cls: string }> = {
  invited: { label: 'Invited', cls: 'border-[#d8f3ff]/25 bg-white/5 text-mist' },
  joined: { label: 'Joined', cls: 'border-sky/40 bg-volt/10 text-sky' },
  first_vibe: { label: 'First Vibe', cls: 'border-beam/50 bg-volt/15 text-beam' },
  rewarded: { label: 'Rewarded', cls: 'border-[#34d399]/50 bg-[#34d399]/10 text-[#6ee7b7]' },
};

export function ReferralsScreen({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [aiCopy, setAiCopy] = useState<string | null>(null);

  const active = REFERRALS.filter((r) => r.status === 'first_vibe' || r.status === 'rewarded').length;
  const nextTier = REFERRAL_TIERS.find((t) => active < t.need) ?? REFERRAL_TIERS[REFERRAL_TIERS.length - 1];
  const link = `https://vado.app/join/${REFERRAL_CODE}`;

  const copy = (what: 'code' | 'link') => {
    navigator.clipboard?.writeText(what === 'code' ? REFERRAL_CODE : link).catch(() => undefined);
    setCopied(what);
    toast(what === 'code' ? 'Invite code copied' : 'Invite link copied');
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <ScreenOverlay title="Referrals & growth" onClose={onClose}>
      <div className="rounded-3xl border border-[#d8f3ff]/30 bg-glass p-5 backdrop-blur-lg">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-beam">
          <UserPlus size={13} /> Your invite code
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-xl border border-beam/50 bg-volt/15 px-4 py-2.5 font-mono text-[16px] font-semibold tracking-wider text-ink">
            {REFERRAL_CODE}
          </span>
          <button
            type="button"
            onClick={() => copy('code')}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff]/30 bg-glass px-4 py-2.5 text-[12px] text-ink transition-colors hover:border-beam/70"
          >
            {copied === 'code' ? <Check size={13} className="text-beam" /> : <Copy size={13} />} Copy code
          </button>
          <button
            type="button"
            onClick={() => copy('link')}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff]/30 bg-glass px-4 py-2.5 text-[12px] text-ink transition-colors hover:border-beam/70"
          >
            {copied === 'link' ? <Check size={13} className="text-beam" /> : <Link2 size={13} />} Copy link
          </button>
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-mist">
          Rewards release only after a friend posts their first Vibe. Friend names are masked in this demo.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(['invited', 'joined', 'first_vibe', 'rewarded'] as const).map((s) => (
          <div key={s} className="rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3 py-3.5 text-center backdrop-blur-lg">
            <p className="text-[20px] font-semibold text-ink">{REFERRALS.filter((r) => r.status === s).length}</p>
            <p className="mt-0.5 text-[10px] uppercase tracking-wide text-mist">{STATUS_META[s].label}</p>
          </div>
        ))}
      </div>

      <SectionCard title="Next reward tier" className="mt-4">
        <div className="flex items-center gap-4">
          <ProgressRing pct={(active / nextTier.need) * 100} size={72} label={`${active} of ${nextTier.need} active referrals`} />
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-semibold text-ink">
              <Gift size={14} className="mr-1.5 inline-block text-beam" />
              {nextTier.label}
            </p>
            <p className="mt-1 text-[12px] text-mist">
              {active} of {nextTier.need} active · reward +{nextTier.reward.toLocaleString()} demo coins
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-1.5">
          {REFERRAL_TIERS.map((t) => (
            <li key={t.need} className={`flex items-center justify-between text-[12px] ${active >= t.need ? 'text-beam' : 'text-mist'}`}>
              <span>{active >= t.need ? <Check size={12} className="mr-1.5 inline" /> : <span className="mr-2 inline-block w-3 h-px bg-mist align-middle" />}
                {t.label}
              </span>
              <span>+{fmt(t.reward)} coins</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Your referrals" className="mt-4">
        <ul className="divide-y divide-[#d8f3ff]/10">
          {REFERRALS.map((r) => (
            <li key={r.masked} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-[#123a66] to-[#1f8a70]" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] text-ink">{r.masked}</span>
                <span className="block text-[11px] text-mist">invited {r.when} ago</span>
              </span>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${STATUS_META[r.status].cls}`}>
                {STATUS_META[r.status].label}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Growth copy" className="mt-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setAiCopy(vadoReply('Write a friendly referral message.').text)}
            className="inline-flex items-center gap-1.5 rounded-full border border-beam/50 bg-volt/20 px-4 py-2 text-[12px] font-medium text-beam transition-colors hover:bg-volt/30"
          >
            <Sparkles size={13} /> Draft with VADO AI
          </button>
          {aiCopy && (
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(aiCopy).catch(() => undefined);
                toast('Invite copy copied');
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#d8f3ff]/30 bg-glass px-4 py-2 text-[12px] text-ink transition-colors hover:border-beam/70"
            >
              <Copy size={13} /> Copy
            </button>
          )}
        </div>
        {aiCopy && (
          <p className="mt-3 whitespace-pre-line rounded-2xl border border-[#d8f3ff]/20 bg-white/5 p-3 text-[13px] leading-relaxed text-ink">
            {aiCopy}
          </p>
        )}
      </SectionCard>
    </ScreenOverlay>
  );
}
