import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, Package, Tag, UserCog, Star, Info } from 'lucide-react';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime, cn } from '../../lib/utils';

const ICONS = { order: Package, offer: Tag, account: UserCog, review: Star, system: Info };
const TONES = {
  order: 'bg-brand-50 text-brand-700',
  offer: 'bg-carrot-50 text-carrot-700',
  account: 'bg-sky-50 text-sky-700',
  review: 'bg-amber-50 text-amber-700',
  system: 'bg-black/[.05] text-charcoal/60',
};

export default function Notifications() {
  const { notifications, unreadCount, loadNotifications, markAllRead } = useAuth();

  useEffect(() => { loadNotifications(); }, [loadNotifications]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="h-sub">Notifications</h1>
          <p className="mt-1 text-sm text-charcoal/55">
            {unreadCount > 0 ? unreadCount + ' unread' : 'You are all caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" icon={CheckCheck} onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </header>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications yet"
          description="Order updates, offers and replies to your reviews will show up here."
          actionLabel="Explore Snacks"
          actionTo="/menu"
        />
      ) : (
        <ul className="space-y-3">
          {notifications.map((n) => {
            const Icon = ICONS[n.type] || Info;
            const body = (
              <>
                <span className={cn('grid h-11 w-11 shrink-0 place-items-center rounded-2xl', TONES[n.type] || TONES.system)}>
                  <Icon size={19} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{n.title}</span>
                  <span className="mt-0.5 block text-sm leading-relaxed text-charcoal/60">{n.body}</span>
                  <span className="mt-1 block text-xs text-charcoal/40">{formatDateTime(n.createdAt)}</span>
                </span>
                {!n.isRead && <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-carrot-500" />}
              </>
            );

            return (
              <li key={n._id}>
                {n.link ? (
                  <Link
                    to={n.link}
                    className={cn('card flex gap-4 p-4 transition hover:shadow-pop', !n.isRead && 'ring-1 ring-brand-200')}
                  >
                    {body}
                  </Link>
                ) : (
                  <div className={cn('card flex gap-4 p-4', !n.isRead && 'ring-1 ring-brand-200')}>{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
