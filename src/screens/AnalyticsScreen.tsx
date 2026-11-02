import { useMemo, useState } from 'react';
import { BarChart3, Eye, Heart, Bookmark, Share2, Sparkles } from 'lucide-react';
import { GLOBAL_VIBES, TOP_CATEGORIES, analyticsSeries, fmt } from '../data/mock';
import { vadoReply } from '../lib/ai';
import { BarChart, LineChart, Sparkline } from '../components/charts';
import { Chip, SectionCard, ScreenOverlay } from '../components/ui';

const PERIODS = [7, 30, 90] as const;

export function AnalyticsScreen({ onClose }: { onClose: () => void }) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(30);
  const series = useMemo(() => analyticsSeries(period), [period]);

  const totals = useMemo(() => {
    const sum = (k: 'views' | 'likes' | 'saves' | 'shares') => series.reduce((a, p) => a + p[k], 0);
    return { views: sum('views'), likes: sum('likes'), saves: sum('saves'), shares: sum('shares') };
  }, [series]);

  const insight = useMemo(() => vadoReply('Explain my analytics.').text, []);
  const weekly = useMemo(
    () =>
      series.slice(-28).reduce<{ label: string; value: number }[]>((acc, p, i) => {
        const bucket = Math.floor(i / 7);
        if (!acc[bucket]) acc[bucket] = { label: `W${bucket + 1}`, value: 0 };
        acc[bucket].value += p.views;
        return acc;
      }, []),
    [series]
  );

  const perVibe = [...GLOBAL_VIBES].sort((a, b) => b.views - a.views).slice(0, 6);

  return (
    <ScreenOverlay title="Analytics" onClose={onClose}>
      <div className="mb-4 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {PERIODS.map((p) => (
            <Chip key={p} active={period === p} onClick={() => setPeriod(p)}>
              {p}d
            </Chip>
          ))}
        </div>
        <span className="text-[11px] text-mist">Aggregated demo data · no personal identifiers</span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Metric icon={<Eye size={14} />} label="Views" value={fmt(totals.views)} />
        <Metric icon={<Heart size={14} />} label="Likes" value={fmt(totals.likes)} />
        <Metric icon={<Bookmark size={14} />} label="Saves" value={fmt(totals.saves)} />
        <Metric icon={<Share2 size={14} />} label="Shares" value={fmt(totals.shares)} />
      </div>

      <SectionCard title={`Views — last ${period} days`} className="mt-4">
        <LineChart points={series.map((p) => p.views)} label={`Views over the last ${period} days`} />
      </SectionCard>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <SectionCard title="Weekly engagement">
          <BarChart data={weekly} label="Views per week" />
        </SectionCard>
        <SectionCard title="Audience by category">
          <ul className="space-y-2.5">
            {TOP_CATEGORIES.map((c) => (
              <li key={c.label}>
                <div className="mb-1 flex justify-between text-[12px]">
                  <span className="text-ink">{c.label}</span>
                  <span className="text-mist">{c.pct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#d8f3ff]/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-volt to-beam shadow-glow-in"
                    style={{ width: `${c.pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="VADO AI insight" className="mt-4">
        <p className="flex gap-2 text-[13px] leading-relaxed text-ink">
          <Sparkles size={15} className="mt-0.5 shrink-0 text-beam" />
          {insight}
        </p>
      </SectionCard>

      <SectionCard title="Top vibes" className="mt-4">
        <ul className="divide-y divide-[#d8f3ff]/10">
          {perVibe.map((v, i) => (
            <li key={v.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="w-5 text-[12px] font-semibold text-mist">{i + 1}</span>
              <span className="h-9 w-9 shrink-0 rounded-xl" style={{ background: v.gradient }} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] text-ink">{v.caption}</span>
                <span className="block text-[11px] text-mist">{v.category} · {v.mood}</span>
              </span>
              <Sparkline points={analyticsSeries(14).map((p) => Math.round(p.views * (0.4 + i * 0.15)))} />
              <span className="w-14 text-right text-[12px] font-medium text-ink">{fmt(v.views)}</span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <p className="mt-4 flex items-center gap-1.5 text-[11px] text-mist">
        <BarChart3 size={12} /> Figures are simulated for this demo and stored only on this device.
      </p>
    </ScreenOverlay>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d8f3ff]/25 bg-glass px-3 py-3.5 backdrop-blur-lg">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-mist">
        <span className="text-beam">{icon}</span>
        {label}
      </p>
      <p className="mt-1.5 text-[20px] font-semibold text-ink">{value}</p>
    </div>
  );
}
