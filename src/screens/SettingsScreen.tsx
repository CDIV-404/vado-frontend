import { useState } from 'react';
import { Check, ChevronRight, Globe2, MonitorSmartphone, Plus, Target, Trash2 } from 'lucide-react';
import { DEFAULT_GOALS, LANGUAGES, PERSONALITIES, type OnboardingGoal } from '../data/mock';
import { clearAll, load, save } from '../lib/store';
import { personalityLine, type AiPersonality } from '../lib/ai';
import { useToast } from '../components/Toast';
import { ConfirmModal, SectionCard, ScreenOverlay } from '../components/ui';

export type VadoSettings = {
  reduceMotion: boolean;
  autoCaption: boolean;
  autoTranslate: boolean;
  privateAccount: boolean;
  showActivity: boolean;
  notifLikes: boolean;
  notifFollows: boolean;
  notifRewards: boolean;
  notifAi: boolean;
  language: string;
  region: string;
  restrictedMode: boolean;
  quietMode: boolean;
  dataSaver: boolean;
};

export const DEFAULT_SETTINGS: VadoSettings = {
  reduceMotion: false,
  autoCaption: true,
  autoTranslate: false,
  privateAccount: false,
  showActivity: true,
  notifLikes: true,
  notifFollows: true,
  notifRewards: true,
  notifAi: true,
  language: 'en',
  region: 'Global',
  restrictedMode: false,
  quietMode: false,
  dataSaver: false,
};

export function loadSettings(): VadoSettings {
  return { ...DEFAULT_SETTINGS, ...load<Partial<VadoSettings>>('settings', {}) };
}

export function SettingsScreen({
  session,
  onClose,
  onSignOut,
}: {
  session: string | null;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const toast = useToast();
  const [s, setS] = useState<VadoSettings>(loadSettings);
  const [page, setPage] = useState<'home' | 'language'>('home');
  const [confirm, setConfirm] = useState<null | 'clearData' | 'deleteAccount' | 'clearHistory'>(null);
  const [personality, setPersonality] = useState<AiPersonality>(() => load<AiPersonality>('personality', 'calm'));
  const [customText, setCustomText] = useState<string>(() => load<string>('personalityCustom', ''));
  const [goals, setGoals] = useState<OnboardingGoal[]>(() => load<OnboardingGoal[]>('goals', DEFAULT_GOALS));
  const [goalDraft, setGoalDraft] = useState('');

  const setPersonalityMode = (id: AiPersonality) => {
    setPersonality(id);
    save('personality', id);
    toast(`${id === 'custom' ? 'Custom' : PERSONALITIES.find((p) => p.id === id)?.label} mode on — applied everywhere`);
  };

  const persistGoals = (next: OnboardingGoal[]) => {
    setGoals(next);
    save('goals', next);
  };

  const patch = (p: Partial<VadoSettings>) => {
    const next = { ...s, ...p };
    setS(next);
    save('settings', next);
    window.dispatchEvent(new Event('vado:settings'));
  };

  const handle = `@${(session ?? 'you').toLowerCase().replace(/\s+/g, '.')}`;

  if (page === 'language') {
    const rtl = LANGUAGES.find((l) => l.code === s.language)?.rtl;
    return (
      <ScreenOverlay title="Language & region" onClose={() => setPage('home')}>
        <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Language</label>
        <ul className="space-y-1.5" aria-label="Languages">
          {LANGUAGES.map((l) => (
            <li key={l.code}>
              <button
                type="button"
                onClick={() => {
                  patch({ language: l.code });
                  toast(`Language set to ${l.label}`);
                }}
                dir={l.rtl ? 'rtl' : 'ltr'}
                className={`flex w-full items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-colors ${
                  s.language === l.code ? 'border-beam bg-volt/15' : 'border-[#d8f3ff]/20 bg-glass hover:border-beam/50'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-ink">{l.native}</span>
                  <span className="block text-[11px] text-mist">{l.label}{l.rtl ? ' · RTL' : ''}</span>
                </span>
                <span className="hidden h-1.5 w-24 overflow-hidden rounded-full bg-[#d8f3ff]/15 sm:block" aria-hidden="true">
                  <span className="block h-full rounded-full bg-gradient-to-r from-volt to-beam" style={{ width: `${l.pct}%` }} />
                </span>
                <span className="w-10 text-right text-[11px] text-mist">{l.pct}%</span>
                {s.language === l.code && <Check size={15} className="shrink-0 text-beam" />}
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] leading-relaxed text-mist" dir={rtl ? 'rtl' : 'ltr'}>
          Percentages show translation coverage in this demo. The interface stays in English; Vibe captions can be auto-translated from the creator.
        </p>
        <label className="mb-1.5 mt-6 block text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Region</label>
        <select
          value={s.region}
          onChange={(e) => patch({ region: e.target.value })}
          aria-label="Region"
          className="w-full rounded-xl border border-[#d8f3ff]/30 bg-deep px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-beam/70"
        >
          {['Global', 'North America', 'Latin America', 'Europe', 'Middle East', 'South Asia', 'East Asia', 'Africa', 'Oceania'].map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </ScreenOverlay>
    );
  }

  return (
    <ScreenOverlay title="Settings" onClose={onClose}>
      <div className="space-y-4">
        <SectionCard title="Account">
          <div className="flex items-center gap-3">
            <span className="h-11 w-11 shrink-0 rounded-full bg-gradient-to-br from-volt to-beam" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold text-ink">{session ?? 'Not signed in'}</p>
              <p className="truncate text-[12px] text-mist">{handle} · demo account</p>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-mist">Email on file: d***@example.com · No real credentials are stored in this demo.</p>
        </SectionCard>

        <SectionCard title="VADO AI">
          <Toggle label="Suggest captions while creating" hint="AI drafts a caption for every new Vibe." checked={s.autoCaption} onChange={(v) => patch({ autoCaption: v })} />
          <Toggle label="Auto-translate published vibes" hint="Adds three translations automatically." checked={s.autoTranslate} onChange={(v) => patch({ autoTranslate: v })} />
          <div className="border-b border-[#d8f3ff]/10 py-2.5">
            <p className="text-[13px] font-medium text-ink">Personality</p>
            <p className="mt-0.5 text-[11px] text-mist">How VADO AI sounds in chat, the sheet and reflections.</p>
            <div className="mt-2 flex flex-wrap gap-1.5" role="radiogroup" aria-label="AI personality mode">
              {PERSONALITIES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={personality === p.id}
                  onClick={() => setPersonalityMode(p.id)}
                  className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                    personality === p.id ? 'border-beam bg-volt/25 text-white' : 'border-[#d8f3ff]/25 bg-white/5 text-mist hover:text-ink'
                  }`}
                  title={p.desc}
                >
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                role="radio"
                aria-checked={personality === 'custom'}
                onClick={() => setPersonalityMode('custom')}
                className={`rounded-full border px-3 py-1.5 text-[11px] transition-colors ${
                  personality === 'custom' ? 'border-beam bg-volt/25 text-white' : 'border-[#d8f3ff]/25 bg-white/5 text-mist hover:text-ink'
                }`}
              >
                Custom
              </button>
            </div>
            {personality === 'custom' && (
              <textarea
                value={customText}
                onChange={(e) => {
                  const v = e.target.value.slice(0, 160);
                  setCustomText(v);
                  save('personalityCustom', v);
                }}
                placeholder="e.g. “like a patient film-studies tutor who loves bad puns”"
                aria-label="Custom personality instructions"
                rows={2}
                className="mt-2.5 w-full resize-none rounded-xl border border-[#d8f3ff]/30 bg-deep px-3 py-2 text-[12px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
              />
            )}
            <p className="mt-2 text-[11px] leading-relaxed text-mist">{personalityLine(personality, customText)}</p>
          </div>
          <Row label="Clear AI chat history" hint="Removes saved replies on this device." onClick={() => setConfirm('clearHistory')} />
        </SectionCard>

        <SectionCard title="Your goals">
          <ul className="space-y-1">
            {goals.map((g) => (
              <li key={g.id} className="flex items-center gap-2.5 border-b border-[#d8f3ff]/10 py-2 last:border-0">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={g.done}
                  aria-label={`Goal: ${g.text}`}
                  onClick={() => persistGoals(goals.map((x) => (x.id === g.id ? { ...x, done: !x.done } : x)))}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                    g.done ? 'border-beam bg-volt/50 text-white' : 'border-[#d8f3ff]/40 bg-white/5 text-transparent'
                  }`}
                >
                  <Check size={12} />
                </button>
                <span className={`min-w-0 flex-1 text-[13px] ${g.done ? 'text-mist line-through' : 'text-ink'}`}>{g.text}</span>
                <button
                  type="button"
                  aria-label={`Delete goal ${g.text}`}
                  onClick={() => persistGoals(goals.filter((x) => x.id !== g.id))}
                  className="rounded-full p-1.5 text-mist transition-colors hover:text-red-300"
                >
                  <Trash2 size={12} />
                </button>
              </li>
            ))}
          </ul>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const text = goalDraft.trim();
              if (!text) return;
              persistGoals([...goals, { id: `goal${Date.now()}`, text: text.slice(0, 80), done: false }]);
              setGoalDraft('');
              toast('Goal added');
            }}
            className="mt-2.5 flex gap-2"
          >
            <input
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              placeholder="Add a goal…"
              aria-label="New goal"
              className="min-w-0 flex-1 rounded-full border border-[#d8f3ff]/30 bg-deep px-3.5 py-2 text-[12px] text-ink placeholder:text-mist/60 outline-none focus:border-beam/70"
            />
            <button
              type="submit"
              disabled={!goalDraft.trim()}
              aria-label="Add goal"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-volt to-beam text-white shadow-glow disabled:opacity-40"
            >
              <Plus size={14} />
            </button>
          </form>
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-mist">
            <Target size={12} className="text-beam" /> {goals.filter((g) => g.done).length} of {goals.length} done — set during onboarding, editable any time.
          </p>
        </SectionCard>

        <SectionCard title="Privacy">
          <Toggle label="Private account" hint="Only followers see your vibes." checked={s.privateAccount} onChange={(v) => patch({ privateAccount: v })} />
          <Toggle label="Show activity to followers" hint="“Nova liked this” style signals." checked={s.showActivity} onChange={(v) => patch({ showActivity: v })} />
        </SectionCard>

        <SectionCard title="Notifications">
          <Toggle label="Likes & comments" checked={s.notifLikes} onChange={(v) => patch({ notifLikes: v })} />
          <Toggle label="New followers" checked={s.notifFollows} onChange={(v) => patch({ notifFollows: v })} />
          <Toggle label="Rewards & campaigns" checked={s.notifRewards} onChange={(v) => patch({ notifRewards: v })} />
          <Toggle label="VADO AI updates" checked={s.notifAi} onChange={(v) => patch({ notifAi: v })} />
        </SectionCard>

        <SectionCard title="Appearance">
          <Toggle label="Reduce motion" hint="Disables pulses, breathing glow and slide animations." checked={s.reduceMotion} onChange={(v) => patch({ reduceMotion: v })} />
          <Toggle label="Data saver" hint="Simplifies gradients and blur for low-bandwidth devices." checked={s.dataSaver} onChange={(v) => patch({ dataSaver: v })} />
          <div className="mt-2 flex items-center gap-2 text-[12px] text-mist">
            <MonitorSmartphone size={14} className="text-beam" />
            Layout adapts automatically from phone to desktop.
          </div>
        </SectionCard>

        <SectionCard title="Language & region">
          <Row
            label="Language & region"
            hint={`${LANGUAGES.find((l) => l.code === s.language)?.label ?? 'English'} · ${s.region}`}
            icon={<Globe2 size={15} />}
            onClick={() => setPage('language')}
            trailing={<ChevronRight size={16} className="text-mist" />}
          />
        </SectionCard>

        <SectionCard title="Data">
          <Row label="Clear local demo data" hint="Removes vibes, likes, chats and settings from this browser." onClick={() => setConfirm('clearData')} danger />
          <Row label="Delete account" hint="Erases everything tied to this demo profile." onClick={() => setConfirm('deleteAccount')} danger />
        </SectionCard>

        <SectionCard title="Sign in">
          <Row label="Sign out of this device" hint="You can sign back in any time — data stays local." onClick={() => {
            localStorage.removeItem('vado.session');
            onSignOut();
            onClose();
            toast('Signed out');
          }} />
        </SectionCard>
      </div>

      <ConfirmModal
        open={confirm === 'clearData'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          clearAll();
          toast('Demo data cleared');
          setConfirm(null);
          onClose();
          window.location.reload();
        }}
        title="Clear all local data?"
        body="Published vibes, likes, saved posts, AI history and settings stored in this browser will be removed. This cannot be undone."
        confirmLabel="Clear data"
        danger
      />
      <ConfirmModal
        open={confirm === 'deleteAccount'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          clearAll();
          toast('Demo account deleted');
          setConfirm(null);
          onSignOut();
          onClose();
          window.location.reload();
        }}
        title="Delete this demo account?"
        body="This demo profile and all of its local data will be erased. Since no real data exists, nothing is sent anywhere. This cannot be undone."
        confirmLabel="Delete account"
        danger
      />
      <ConfirmModal
        open={confirm === 'clearHistory'}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          save('aiChat', []);
          save('aiSaved', []);
          toast('AI chat history cleared');
          setConfirm(null);
        }}
        title="Clear AI chat history?"
        body="Saved AI replies for this device will be removed. This cannot be undone."
        confirmLabel="Clear history"
        danger
      />
    </ScreenOverlay>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 border-b border-[#d8f3ff]/10 py-2.5 last:border-0">
      <span className="min-w-0">
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        {hint && <span className="block text-[11px] text-mist">{hint}</span>}
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

function Row({
  label,
  hint,
  icon,
  trailing,
  onClick,
  danger = false,
}: {
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  trailing?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-[#d8f3ff]/10 py-2.5 text-left last:border-0"
    >
      {icon && <span className="text-beam">{icon}</span>}
      <span className="min-w-0 flex-1">
        <span className={`block text-[13px] font-medium ${danger ? 'text-red-300' : 'text-ink'}`}>{label}</span>
        {hint && <span className="block text-[11px] text-mist">{hint}</span>}
      </span>
      {trailing}
    </button>
  );
}
