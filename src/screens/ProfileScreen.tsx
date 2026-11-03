import { useState } from 'react';
import { Award, Bookmark, Eye, Globe2, Heart, MessageCircle, Settings2, Sparkles } from 'lucide-react';
import { GLOBAL_VIBES, USERS, computeBadges, fmt, type Collection, type Vibe } from '../data/mock';
import { load, save } from '../lib/store';
import { useToast } from '../components/Toast';
import { Chip, EmptyState, Sheet, ScreenOverlay } from '../components/ui';

type ProfileTab = 'vibes' | 'saved' | 'liked';

export function ProfileScreen({
  handle,
  session,
  published,
  onClose,
  onCreate,
  onOpenSettings,
}: {
  handle?: string;
  session: string | null;
  published: Vibe[];
  onClose: () => void;
  onCreate: () => void;
  onOpenSettings: () => void;
}) {
  const toast = useToast();
  const own = !handle || handle === `@${(session ?? '').toLowerCase().replace(/\s+/g, '.')}`;
  const profileData = load<Record<string, string>>('profile', {});

  const base = own
    ? {
        name: profileData.name ?? session ?? 'You',
        handle: `@${(session ?? 'you').toLowerCase().replace(/\s+/g, '.')}`,
        bio: profileData.bio ?? 'just landed on VADO — collecting good moods.',
        location: profileData.location ?? 'On this device',
        joined: 'Today',
        avatar: 'linear-gradient(135deg,#1687ff,#a78bfa 55%,#38c9ff)',
        followers: 128,
        following: 86,
        verified: false,
      }
    : (() => {
        const u = USERS.find((x) => x.handle === handle);
        if (u) {
          return {
            name: u.name, handle: u.handle, bio: u.bio, location: u.location, joined: u.joined,
            avatar: u.avatar, followers: u.followers, following: u.following, verified: u.verified,
          };
        }
        const v = GLOBAL_VIBES.find((x) => x.handle === handle);
        return {
          name: v?.creator ?? handle?.replace('@', '') ?? 'Creator',
          handle: handle ?? '@unknown',
          bio: 'vado creator',
          location: 'Somewhere vibing',
          joined: 'Recently',
          avatar: v?.gradient ?? 'linear-gradient(135deg,#334155,#94a3b8)',
          followers: 1000,
          following: 200,
          verified: false,
        };
      })();

  const [tab, setTab] = useState<ProfileTab>('vibes');
  const [editOpen, setEditOpen] = useState(false);
  const [followed, setFollowed] = useState<boolean>(() => load<string[]>('following', []).includes(base.handle));
  const likedIds = load<string[]>('liked', []);
  const savedIds = load<string[]>('saved', []);

  const mine = published.map((v) => ({ ...v, mine: true }));
  const closeOverlay = () => {
    if (editOpen) {
      setEditOpen(false);
      return;
    }
    onClose();
  };
  const liked = GLOBAL_VIBES.filter((v) => likedIds.includes(v.id));
  const saved = GLOBAL_VIBES.filter((v) => savedIds.includes(v.id));
  const list = own ? (tab === 'vibes' ? mine : tab === 'saved' ? saved : liked) : mine;
  const badges = own
    ? computeBadges({
        published: mine.length,
        streak: 3,
        remixes: mine.filter((v) => v.remixOf).length,
        saved: savedIds.length || 24,
        followers: load<string[]>('following', []).length || 16,
        collections: load<Collection[]>('collections', []).length,
        coins: load<string[]>('claimedCampaigns', []).length,
        referrals: 1,
        comments: 2,
        explorer: 0,
        early: 1,
      })
    : computeBadges({ published: 12, streak: 7, remixes: 3, saved: 40, followers: 30, collections: 2, coins: 2, referrals: 0, comments: 15, explorer: 3, early: 1 });

  return (
    <ScreenOverlay
      title={own ? 'Your profile' : base.name}
      onClose={closeOverlay}
      actions={
        own ? (
          <button
            type="button"
            onClick={onOpenSettings}
            aria-label="Open settings"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d8f3ff]/25 bg-glass text-mist transition-colors hover:text-ink"
          >
            <Settings2 size={16} />
          </button>
        ) : undefined
      }
    >
      <div className="flex items-center gap-4">
        <span className="h-16 w-16 shrink-0 rounded-full ring-2 ring-[#d8f3ff]/30" style={{ background: base.avatar }} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-1.5 truncate text-[18px] font-semibold text-ink">
            {base.name}
            {base.verified && <span className="rounded-full bg-beam px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#04121f]">Verified</span>}
          </h2>
          <p className="truncate text-[12px] text-mist">{base.handle} · joined {base.joined}</p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink">{base.bio}</p>
      <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-mist">
        <Globe2 size={12} /> {base.location}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Stat label="Followers" value={fmt(base.followers)} />
        <Stat label="Following" value={fmt(base.following)} />
        <Stat label="Vibes" value={String(own ? mine.length : 12)} />
      </div>

      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">
          <Award size={12} /> {own ? 'Achievements' : `${base.name.split(' ')[0]}’s badges`}
        </p>
        <ul className="flex flex-wrap gap-1.5" aria-label="Achievement badges">
          {badges.map(({ badge, value, earned }) => (
            <li key={badge.id}>
              <span
                title={`${badge.desc}${earned ? ' — earned' : ` — ${Math.min(value, badge.goal)}/${badge.goal}`}`}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium ${
                  earned ? 'border-beam/50 bg-volt/20 text-beam shadow-glow-in' : 'border-[#d8f3ff]/20 bg-white/5 text-mist'
                }`}
              >
                <Award size={11} />
                {badge.name}
                {!earned && <span className="text-[10px]">{Math.min(value, badge.goal)}/{badge.goal}</span>}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 flex gap-2.5">
        {own ? (
          <>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              className="flex-1 rounded-full border border-[#d8f3ff]/30 bg-glass px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-beam/70"
            >
              Edit profile
            </button>
            <button
              type="button"
              onClick={onCreate}
              className="flex-1 rounded-full border border-[#d8f3ff] bg-volt/25 px-4 py-2.5 text-[13px] font-semibold text-white shadow-glow-in transition-colors hover:bg-volt/40"
            >
              Create a Vibe
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => {
                const prev = load<string[]>('following', []);
                const next = followed ? prev.filter((h) => h !== base.handle) : [...prev, base.handle];
                save('following', next);
                setFollowed(!followed);
                toast(followed ? `Unfollowed ${base.name}` : `Following ${base.name}`);
              }}
              className={`flex-1 rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-colors ${
                followed
                  ? 'border-[#d8f3ff]/25 bg-glass text-mist hover:text-ink'
                  : 'border-[#d8f3ff] bg-volt/25 text-white shadow-glow-in hover:bg-volt/40'
              }`}
            >
              {followed ? 'Following' : 'Follow'}
            </button>
            <button
              type="button"
              onClick={() => toast('Messaging opens once you are signed in (demo)')}
              className="flex-1 rounded-full border border-[#d8f3ff]/30 bg-glass px-4 py-2.5 text-[13px] font-medium text-ink transition-colors hover:border-beam/70"
            >
              Message
            </button>
          </>
        )}
      </div>

      {own && (
        <div className="mt-5 flex gap-2">
          {(
            [
              { k: 'vibes', label: 'My Vibes', icon: <Sparkles size={12} /> },
              { k: 'saved', label: 'Saved', icon: <Bookmark size={12} /> },
              { k: 'liked', label: 'Liked', icon: <Heart size={12} /> },
            ] as const
          ).map((t) => (
            <Chip key={t.k} active={tab === t.k} onClick={() => setTab(t.k)}>
              <span className="mr-1 inline-flex align-middle">{t.icon}</span>
              {t.label}
            </Chip>
          ))}
        </div>
      )}

      <div className="mt-4">
        {list.length === 0 ? (
          <EmptyState
            icon={tab === 'liked' ? <Heart size={26} /> : tab === 'saved' ? <Bookmark size={26} /> : <Sparkles size={26} />}
            title={own && tab === 'vibes' ? 'Your creative world starts here.' : 'Nothing here yet'}
            body={
              own && tab === 'vibes'
                ? 'Publish your first Vibe and it will live right here.'
                : tab === 'saved'
                  ? 'Tap the bookmark on any Vibe to keep it in your collection.'
                  : 'Liked vibes from across the feed show up here.'
            }
            action={
              own && tab === 'vibes' ? (
                <button
                  type="button"
                  onClick={onCreate}
                  className="rounded-full border border-[#d8f3ff] bg-volt/25 px-6 py-2.5 text-[13px] font-semibold text-white shadow-glow-in transition-colors hover:bg-volt/40"
                >
                  Create your first Vibe
                </button>
              ) : undefined
            }
          />
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {list.map((v) => (
              <li key={v.id} className="flex items-center gap-3 rounded-2xl border border-[#d8f3ff]/25 bg-glass p-2.5 backdrop-blur-lg">
                <span className="h-12 w-12 shrink-0 rounded-xl" style={{ background: v.gradient }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-ink">{v.caption}</span>
                  {v.remixedFrom && <span className="block truncate text-[10px] text-beam">Remixed from {v.remixedFrom}</span>}
                  {v.coCreatedWith && v.coCreatedWith.length > 0 && (
                    <span className="block truncate text-[10px] text-beam">Made with {v.coCreatedWith.join(', ')}</span>
                  )}
                  <span className="mt-0.5 flex items-center gap-2 text-[11px] text-mist">
                    <span className="inline-flex items-center gap-1"><Eye size={11} />{fmt(v.views)}</span>
                    <span className="inline-flex items-center gap-1"><Heart size={11} />{fmt(v.likes)}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle size={11} />{fmt(v.comments)}</span>
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit profile">
        <EditProfile
          initial={{ name: base.name, bio: base.bio, location: base.location }}
          onSave={(data) => {
            save('profile', data);
            setEditOpen(false);
            toast('Profile updated successfully');
            onClose();
          }}
        />
      </Sheet>
    </ScreenOverlay>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[#d8f3ff]/25 bg-glass px-2 py-3 text-center backdrop-blur-lg">
      <p className="text-[17px] font-semibold text-ink">{value}</p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-mist">{label}</p>
    </div>
  );
}

function EditProfile({
  initial,
  onSave,
}: {
  initial: { name: string; bio: string; location: string };
  onSave: (data: { name: string; bio: string; location: string }) => void;
}) {
  const [name, setName] = useState(initial.name);
  const [bio, setBio] = useState(initial.bio);
  const [location, setLocation] = useState(initial.location);
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onSave({ name: name.trim(), bio: bio.trim(), location: location.trim() });
      }}
    >
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-[#d8f3ff]/30 bg-volt/10 px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-beam/70"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={140}
          className="w-full resize-none rounded-xl border border-[#d8f3ff]/30 bg-volt/10 px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-beam/70"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-beam">Location</span>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-xl border border-[#d8f3ff]/30 bg-volt/10 px-3.5 py-2.5 text-[13px] text-ink outline-none focus:border-beam/70"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-full border border-[#d8f3ff] bg-volt/25 px-4 py-2.5 text-[13px] font-semibold text-white shadow-glow-in transition-colors hover:bg-volt/40"
      >
        Save changes
      </button>
    </form>
  );
}
