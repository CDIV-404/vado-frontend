import { useState } from 'react';
import { Ban, EyeOff, ShieldCheck, Sparkles, Volume2 } from 'lucide-react';
import {
  AI_ACTIVITY_SEED, BLOCKED_SEED, REPORT_REASONS, SAFETY_GUIDELINES, SEED_REPORTS,
  type ReportCase,
} from '../data/mock';
import { load, save } from '../lib/store';
import { DEFAULT_SETTINGS, loadSettings, type VadoSettings } from './SettingsScreen';
import { useToast } from '../components/Toast';
import { Chip, ConfirmModal, EmptyState, ScreenOverlay, SectionCard } from '../components/ui';

type Controls = Pick<VadoSettings, 'restrictedMode' | 'quietMode' | 'dataSaver'>;

export function SafetyScreen({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [openGuide, setOpenGuide] = useState<string | null>(SAFETY_GUIDELINES[0].id);
  const [controls, setControls] = useState<Controls>(() => {
    const s = loadSettings();
    return { restrictedMode: s.restrictedMode, quietMode: s.quietMode, dataSaver: s.dataSaver };
  });
  const [blocked, setBlocked] = useState<string[]>(() => load<string[]>('blocked', BLOCKED_SEED));
  const [blockDraft, setBlockDraft] = useState('');
  const [reports, setReports] = useState<ReportCase[]>(() => load<ReportCase[]>('reports', SEED_REPORTS));
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [target, setTarget] = useState('');
  const [note, setNote] = useState('');
  const [aiLog, setAiLog] = useState(() => load('aiActivity', AI_ACTIVITY_SEED));
  const [confirm, setConfirm] = useState<null | { k: 'unblock'; handle: string } | { k: 'block' } | { k: 'report' } | { k: 'clearAi' }>(null);

  const patchControls = (p: Partial<Controls>) => {
    const next = { ...controls, ...p };
    setControls(next);
    const merged = { ...DEFAULT_SETTINGS, ...load<Partial<VadoSettings>>('settings', {}), ...next };
    save('settings', merged);
    window.dispatchEvent(new Event('vado:settings'));
  };

  const doBlock = () => {
    const handle = blockDraft.trim().toLowerCase();
    if (!handle) return;
    const norm = handle.startsWith('@') ? handle : `@${handle}`;
    const next = [norm, ...blocked.filter((b) => b !== norm)];
    save('blocked', next);
    setBlocked(next);
    setBlockDraft('');
    toast(`${norm} blocked — hidden on this device`);
  };

  const doUnblock = (handle: string) => {
    const next = blocked.filter((b) => b !== handle);
    save('blocked', next);
    setBlocked(next);
    toast(`${handle} unblocked`);
  };

  const doReport = () => {
    const c: ReportCase = {
      id: `r${Date.now()}`,
      target: target.trim() || 'unnamed item',
      reason,
      note: note.trim(),
      status: 'submitted',
    };
    const next = [c, ...reports];
    save('reports', next);
    setReports(next);
    setTarget('');
    setNote('');
    window.dispatchEvent(new Event('vado:notifs'));
    toast('Report submitted — a human reviews it in this demo');
  };

  const clearAi = () => {
    save('aiActivity', []);
    setAiLog([]);
    toast('AI activity log cleared');
  };

  return (
    <ScreenOverlay title="Safety Center" onClose={onClose}>
      <div className="rounded-3xl border border-beam/40 bg-gradient-to-br from-volt/25 to-transparent p-5">
        <p className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-beam">
          <ShieldCheck size={13} /> Safety, on your terms
        </p>
        <p className="mt-2 text-[13px] leading-relaxed text-ink">
          Everything here is stored on this device only. No reports leave the demo, and no real credentials or private data are ever requested.
        </p>
      </div>

      <SectionCard title="Community guidelines" className="mt-4">
        <ul className="divide-y divide-[#d8f3ff]/10">
          {SAFETY_GUIDELINES.map((g) => {
            const open = openGuide === g.id;
            return (
              <li key={g.id}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenGuide(open ? null : g.id)}
                  className="flex w-full items-center gap-2 py-2.5 text-left first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 flex-1 text-[13px] font-semibold text-ink">{g.title}</span>
                  <span className="text-[16px] leading-none text-mist">{open ? '−' : '+'}</span>
                </button>
                {open && <p className="pb-2.5 text-[12px] leading-relaxed text-mist">{g.body}</p>}
              </li>
            );
          })}
        </ul>
      </SectionCard>

      <SectionCard title="Content controls" className="mt-4">
        <ControlToggle
          icon={<EyeOff size={15} />}
          label="Restricted mode"
          hint="Hide AI-heavy and sensitive cards from the feed."
          checked={controls.restrictedMode}
          onChange={(v) => {
            patchControls({ restrictedMode: v });
            toast(v ? 'Restricted mode on' : 'Restricted mode off');
          }}
        />
        <ControlToggle
          icon={<Volume2 size={15} />}
          label="Quiet mode"
          hint="Mute non-priority notifications until you open the bell."
          checked={controls.quietMode}
          onChange={(v) => {
            patchControls({ quietMode: v });
            toast(v ? 'Quiet mode on' : 'Quiet mode off');
          }}
        />
        <ControlToggle
          icon={<Sparkles size={15} />}
          label="Data saver (low bandwidth)"
          hint="Drop ambient gradients and heavy blur for slower connections."
          checked={controls.dataSaver}
          onChange={(v) => {
            patchControls({ dataSaver: v });
            toast(v ? 'Data saver on — visuals simplified' : 'Data saver off');
          }}
        />
      </SectionCard>

      <SectionCard title="Blocked & muted accounts" className="mt-4">
        {blocked.length === 0 ? (
          <p className="text-[12px] text-mist">You have not blocked anyone.</p>
        ) : (
          <ul className="space-y-2">
            {blocked.map((b) => (
              <li key={b} className="flex items-center gap-3 rounded-2xl border border-[#d8f3ff]/20 bg-white/5 px-3.5 py-2.5">
                <Ban size={15} className="shrink-0 text-red-300" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-ink">{b}</span>
                <button
                  type="button"
                  onClick={() => setConfirm({ k: 'unblock', handle: b })}
                  className="rounded-full border border-[#d8f3ff]/25 px-3 py-1 text-[11px] text-mist transition-colors hover:text-ink"
                >
                  Unblock
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (blockDraft.trim()) setConfirm({ k: 'block' });
          }}
          className="mt-3 flex gap-2"
        >
          <input
            value={blockDraft}
            onChange={(e) => setBlockDraft(e.target.value)}
            placeholder="@handle to block"
            aria-label="Handle to block"
            className="min-w-0 flex-1 rounded-full border border-[#d8f3ff]/30 bg-deep px-3.5 py-2 text-[12px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
          />
          <button
            type="submit"
            disabled={!blockDraft.trim()}
            className="rounded-full border border-[#d8f3ff]/40 bg-volt/20 px-4 py-2 text-[12px] font-semibold text-white transition-colors hover:bg-volt/35 disabled:opacity-40"
          >
            Block
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Report something" className="mt-4">
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Report reason">
          {REPORT_REASONS.map((r) => (
            <Chip key={r} active={reason === r} onClick={() => setReason(r)}>
              {r}
            </Chip>
          ))}
        </div>
        <input
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="What are you reporting? (a vibe, comment or handle)"
          aria-label="Report target"
          className="mt-3 w-full rounded-xl border border-[#d8f3ff]/30 bg-deep px-3.5 py-2.5 text-[12px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
        />
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 240))}
          placeholder="Add context (optional). Please do not paste private messages or credentials."
          aria-label="Report details"
          rows={2}
          className="mt-2 w-full resize-none rounded-xl border border-[#d8f3ff]/30 bg-deep px-3.5 py-2.5 text-[12px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
        />
        <button
          type="button"
          onClick={() => setConfirm({ k: 'report' })}
          className="mt-3 rounded-full border border-[#d8f3ff] bg-volt/25 px-5 py-2.5 text-[13px] font-semibold text-white shadow-glow-in transition-colors hover:bg-volt/40"
        >
          Submit report
        </button>

        <h4 className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Your reports</h4>
        {reports.length === 0 ? (
          <EmptyState icon={<ShieldCheck size={24} />} title="No reports yet" body="If you report a vibe or comment, its status will appear here." />
        ) : (
          <ul className="divide-y divide-[#d8f3ff]/10">
            {reports.map((r) => (
              <li key={r.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${r.status === 'resolved' ? 'bg-beam' : 'bg-amber-300'}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] text-ink">{r.reason} — {r.target}</span>
                  <span className="block text-[11px] text-mist">{r.status}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title="AI transparency" className="mt-4">
        <p className="text-[12px] leading-relaxed text-mist">
          A plain log of what VADO AI did for you. AI-assisted captions and drafts always carry a label in the feed.
        </p>
        {aiLog.length === 0 ? (
          <p className="mt-3 text-[12px] text-mist">No AI activity recorded on this device.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {aiLog.map((a) => (
              <li key={a.id} className="rounded-2xl border border-[#d8f3ff]/20 bg-white/5 px-3.5 py-2.5">
                <p className="text-[13px] font-medium text-ink">{a.action}</p>
                <p className="mt-0.5 text-[11px] text-mist">{a.detail}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-sky">{a.surface} · {a.time} ago</p>
              </li>
            ))}
          </ul>
        )}
        {aiLog.length > 0 && (
          <button
            type="button"
            onClick={() => setConfirm({ k: 'clearAi' })}
            className="mt-3 rounded-full border border-red-400/40 bg-red-500/10 px-4 py-2 text-[12px] font-semibold text-red-200 transition-colors hover:bg-red-500/20"
          >
            Clear AI activity log
          </button>
        )}
      </SectionCard>

      <SectionCard title="In an emergency" className="mt-4">
        <p className="text-[12px] leading-relaxed text-mist">
          This is a demo and cannot contact emergency services. If you or someone else is in immediate danger, use your local emergency number. VADO never shares your data — there is nothing to disclose from this device.
        </p>
      </SectionCard>

      <ConfirmModal
        open={confirm?.k === 'block'}
        onClose={() => setConfirm(null)}
        onConfirm={doBlock}
        title="Block this account?"
        body={`Their vibes and comments will be hidden on this device. You can undo it any time. Blocking ${blockDraft.trim()}?`}
        confirmLabel="Block"
        danger
      />
      <ConfirmModal
        open={confirm?.k === 'unblock'}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.k === 'unblock' && doUnblock(confirm.handle)}
        title="Unblock this account?"
        body="Their content may appear in your feed again."
        confirmLabel="Unblock"
      />
      <ConfirmModal
        open={confirm?.k === 'report'}
        onClose={() => setConfirm(null)}
        onConfirm={doReport}
        title="Submit this report?"
        body={`Reason: ${reason}. It stays in this demo so you can review its status. Do not include private messages or credentials.`}
        confirmLabel="Submit report"
      />
      <ConfirmModal
        open={confirm?.k === 'clearAi'}
        onClose={() => setConfirm(null)}
        onConfirm={clearAi}
        title="Clear AI activity log?"
        body="The on-device record of what VADO AI did for you will be removed. This cannot be undone."
        confirmLabel="Clear log"
        danger
      />
    </ScreenOverlay>
  );
}

function ControlToggle({
  icon,
  label,
  hint,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-[#d8f3ff]/10 py-2.5 last:border-0">
      <span className="flex min-w-0 items-start gap-2.5">
        <span className="mt-0.5 text-beam">{icon}</span>
        <span className="min-w-0">
          <span className="block text-[13px] font-medium text-ink">{label}</span>
          <span className="block text-[11px] text-mist">{hint}</span>
        </span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
          checked ? 'border-beam bg-volt/60 shadow-glow-in' : 'border-[#d8f3ff]/30 bg-white/10'
        }`}
      >
        <span
          className={`absolute top-[3px] rounded-full bg-white transition-all ${checked ? 'left-[23px]' : 'left-[3px]'}`}
          style={{ height: 18, width: 18 }}
        />
      </button>
    </label>
  );
}
