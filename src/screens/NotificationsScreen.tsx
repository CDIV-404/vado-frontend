import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Banknote, Bell, CalendarDays, CalendarHeart, CreditCard, Gift, Handshake, MessageCircle, Package, Shield, ShieldCheck, Sparkles,
  ThumbsUp, Target, TrendingUp, UserPlus, Users, Video, Megaphone, Bot, UsersRound,
} from 'lucide-react';
import { NOTIFICATIONS, type NotifKind } from '../data/mock';
import { load, save } from '../lib/store';
import { useToast } from '../components/Toast';
import { Chip, EmptyState, ScreenOverlay } from '../components/ui';

const ICONS: Record<NotifKind, React.ReactNode> = {
  like: <ThumbsUp size={15} />,
  comment: <MessageCircle size={15} />,
  follower: <UserPlus size={15} />,
  message: <Bell size={15} />,
  ai: <Bot size={15} />,
  reward: <TrendingUp size={15} />,
  payout: <Banknote size={15} />,
  referral: <Gift size={15} />,
  campaign: <Megaphone size={15} />,
  stream: <Video size={15} />,
  gift: <Sparkles size={15} />,
  moderation: <Shield size={15} />,
  incident: <AlertTriangle size={15} />,
  mood: <CalendarHeart size={15} />,
  goal: <Target size={15} />,
  circle: <UsersRound size={15} />,
  collab: <Users size={15} />,
  marketplace: <Handshake size={15} />,
  event: <CalendarDays size={15} />,
  subscription: <CreditCard size={15} />,
  purchase: <Package size={15} />,
  safety: <ShieldCheck size={15} />,
};

type Filter = 'all' | 'unread';

export function NotificationsScreen({ onClose }: { onClose: () => void }) {
  const toast = useToast();
  const [readIds, setReadIds] = useState<string[]>(() => load<string[]>('notifRead', []));
  const [filter, setFilter] = useState<Filter>('all');

  const isUnread = (id: string, seed: boolean) => seed && !readIds.includes(id);
  const list = NOTIFICATIONS.filter((n) => filter === 'all' || isUnread(n.id, n.unread));
  const unreadCount = NOTIFICATIONS.filter((n) => isUnread(n.id, n.unread)).length;

  const markAll = () => {
    const ids = NOTIFICATIONS.map((n) => n.id);
    save('notifRead', ids);
    setReadIds(ids);
    window.dispatchEvent(new Event('vado:notifs'));
    toast('All notifications marked read');
  };

  return (
    <ScreenOverlay
      title="Notifications"
      onClose={onClose}
      actions={
        <button
          type="button"
          onClick={markAll}
          disabled={unreadCount === 0}
          className="rounded-full border border-[#d8f3ff]/25 bg-glass px-3.5 py-1.5 text-[12px] text-mist transition-colors hover:text-ink disabled:opacity-40"
        >
          Mark all read
        </button>
      }
    >
      <div className="mb-4 flex gap-2">
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>All</Chip>
        <Chip active={filter === 'unread'} onClick={() => setFilter('unread')}>
          Unread{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Chip>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<Bell size={26} />}
          title={filter === 'unread' ? "You're all caught up" : 'No notifications yet'}
          body={filter === 'unread' ? 'New likes, follows, rewards and AI updates will land here.' : 'Activity on your vibes will show up here.'}
        />
      ) : (
        <ul className="space-y-2.5">
          {list.map((n, i) => {
            const unread = isUnread(n.id, n.unread);
            return (
              <motion.li
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.04, duration: 0.3 }}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (unread) {
                      const next = [...readIds, n.id];
                      save('notifRead', next);
                      setReadIds(next);
                      window.dispatchEvent(new Event('vado:notifs'));
                    }
                  }}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-3.5 py-3 text-left transition-colors ${
                    n.priority === 'high'
                      ? 'border-beam/40 bg-volt/10'
                      : 'border-[#d8f3ff]/25 bg-glass hover:border-beam/50'
                  } ${unread ? '' : 'opacity-70'}`}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#d8f3ff]/25 bg-white/5 text-beam">
                    {ICONS[n.kind]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] leading-snug text-ink">{n.text}</span>
                    <span className="mt-0.5 block text-[11px] text-mist">
                      {n.time} · {n.kind}
                      {n.priority === 'high' && (
                        <span className="ml-1.5 rounded-full border border-beam/40 bg-volt/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-beam">
                          High
                        </span>
                      )}
                    </span>
                  </span>
                  {unread && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-beam shadow-glow" aria-label="Unread" />}
                </button>
              </motion.li>
            );
          })}
        </ul>
      )}
    </ScreenOverlay>
  );
}
