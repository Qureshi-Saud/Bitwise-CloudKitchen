import { NavLink, Outlet } from 'react-router-dom';
import { User, Package, MapPin, Heart, Star, Gift, Bell, ShieldCheck, LogOut } from 'lucide-react';
import Section from '../../components/ui/Section';
import { useAuth } from '../../context/AuthContext';
import { cn, initials, formatINR } from '../../lib/utils';

const TABS = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/addresses', label: 'Addresses', icon: MapPin },
  { to: '/account/favourites', label: 'Favourites', icon: Heart },
  { to: '/account/reviews', label: 'Reviews', icon: Star },
  { to: '/account/rewards', label: 'Rewards', icon: Gift },
  { to: '/account/notifications', label: 'Notifications', icon: Bell },
  { to: '/account/security', label: 'Security', icon: ShieldCheck },
];

export default function Account() {
  const { user, logout, unreadCount } = useAuth();

  return (
    <Section pad="tight">
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <aside className="lg:sticky lg:top-[calc(var(--header-h)+1.5rem)] lg:self-start">
          <div className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-black/5 bg-cream p-5">
              {user.avatar?.url ? (
                <img src={user.avatar.url} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : (
                <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                  {initials(user.name)}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate font-bold">{user.name}</p>
                <p className="truncate text-xs text-charcoal/50">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 divide-x divide-black/5 border-b border-black/5 text-center">
              <div className="py-3">
                <p className="text-lg font-extrabold text-brand-700">{user.stats?.totalOrders || 0}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">Orders</p>
              </div>
              <div className="py-3">
                <p className="text-lg font-extrabold text-carrot-600">{user.rewardPoints || 0}</p>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-charcoal/45">Points</p>
              </div>
            </div>

            <nav className="no-scrollbar flex overflow-x-auto p-2 lg:flex-col" aria-label="Account sections">
              {TABS.map((t) => (
                <NavLink
                  key={t.to}
                  to={t.to}
                  end={t.end}
                  className={({ isActive }) =>
                    cn(
                      'flex shrink-0 items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-semibold transition',
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-charcoal/65 hover:bg-black/[.04]'
                    )
                  }
                >
                  <t.icon size={17} />
                  {t.label}
                  {t.label === 'Notifications' && unreadCount > 0 && (
                    <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-carrot-500 px-1 text-[10px] font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}

              <button
                onClick={logout}
                className="flex shrink-0 items-center gap-3 whitespace-nowrap rounded-2xl px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={17} /> Sign out
              </button>
            </nav>
          </div>

          {!user.isEmailVerified && (
            <div className="card mt-4 border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-bold text-amber-900">Verify your email</p>
              <p className="mt-1 text-xs leading-relaxed text-amber-800/80">
                Check your inbox for the verification link we sent when you signed up.
              </p>
            </div>
          )}

          <div className="card mt-4 p-4">
            <p className="text-xs leading-relaxed text-charcoal/50">
              <strong className="font-semibold text-charcoal/70">Lifetime spend:</strong>{' '}
              {formatINR(user.stats?.totalSpent || 0)} across {user.stats?.totalOrders || 0} one-time orders.
              You have no active plans or subscriptions - we do not offer any.
            </p>
          </div>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </Section>
  );
}
