import { useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, LogOut, User, Package, Heart, Gift, Bell, Phone, MessageCircle } from 'lucide-react';
import { NAV_LINKS, SECONDARY_NAV_LINKS } from '../../lib/constants';
import { useSettings } from '../../context/SettingsContext';
import { cn, initials } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import Button, { IconButton } from '../ui/Button';
import BrandLogo from '../ui/BrandLogo';

const ACCOUNT_LINKS = [
  { to: '/account', label: 'My Profile', icon: User },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/favourites', label: 'Favourites', icon: Heart },
  { to: '/account/notifications', label: 'Notifications', icon: Bell },
  { to: '/account/rewards', label: 'Rewards & Referrals', icon: Gift },
];

export default function MobileMenu({ open, onClose }) {
  const settings = useSettings();
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] xl:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
          />

          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            className="absolute inset-y-0 right-0 flex w-[min(88%,22rem)] flex-col bg-white shadow-pop"
            role="dialog"
            aria-label="Menu"
          >
            <div className="flex items-center justify-between border-b border-black/5 px-5 py-4">
              <Link to="/" onClick={onClose} className="flex items-center gap-2.5">
                <BrandLogo size={36} className="h-9 w-9" />
                <span className="leading-tight">
                  <span className="block font-display text-sm font-extrabold">{settings.brandName}</span>
                  <span className="block text-[10px] font-medium text-brand-700">{settings.tagline}</span>
                </span>
              </Link>
              <IconButton icon={X} label="Close menu" onClick={onClose} />
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {isAuthenticated && (
                <div className="flex items-center gap-3 border-b border-black/5 bg-cream px-5 py-4">
                  {user.avatar?.url ? (
                    <img src={user.avatar.url} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-full bg-brand-100 font-bold text-brand-700">
                      {initials(user.name)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-bold">{user.name}</p>
                    <p className="truncate text-xs text-charcoal/50">{user.email}</p>
                  </div>
                </div>
              )}

              <nav className="px-3 py-3" aria-label="Mobile navigation">
                {NAV_LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-2xl px-4 py-3 text-[15px] font-semibold transition',
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-charcoal/75 hover:bg-black/[.04]'
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>

              <p className="px-6 pt-1 text-xs font-bold uppercase tracking-wide text-charcoal/40">More</p>
              <nav className="px-3 pb-3 pt-2" aria-label="More pages">
                {SECONDARY_NAV_LINKS.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'block rounded-2xl px-4 py-2.5 text-sm font-medium transition',
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-charcoal/75 hover:bg-black/[.04]'
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                ))}
              </nav>

              {isAuthenticated && (
                <>
                  <p className="px-6 pt-2 text-xs font-bold uppercase tracking-wide text-charcoal/40">My Account</p>
                  <nav className="px-3 pb-3 pt-2">
                    {ACCOUNT_LINKS.map((i) => (
                      <Link
                        key={i.to}
                        to={i.to}
                        onClick={onClose}
                        className="flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-charcoal/75 transition hover:bg-black/[.04]"
                      >
                        <i.icon size={17} className="text-charcoal/40" /> {i.label}
                      </Link>
                    ))}
                  </nav>
                </>
              )}

              <div className="border-t border-black/5 px-5 py-4">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-charcoal/40">Need help?</p>
                {settings.supportPhone && (
                  <a
                    href={settings.telLink}
                    className="flex items-center gap-3 py-2 text-sm font-medium text-charcoal/75"
                  >
                    <Phone size={16} className="text-brand-600" /> {settings.supportPhone}
                  </a>
                )}
                {settings.whatsappLink && (
                  <a
                    href={settings.whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 py-2 text-sm font-medium text-charcoal/75"
                  >
                    <MessageCircle size={16} className="text-brand-600" /> Order on WhatsApp
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-2 border-t border-black/5 p-4 pb-safe-4">
              <Button to="/menu" variant="accent" size="md" onClick={onClose} className="w-full">
                ORDER NOW
              </Button>
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    logout();
                    onClose();
                  }}
                  className="btn btn-md w-full text-red-600 hover:bg-red-50"
                >
                  <LogOut size={17} /> Sign out
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button to="/login" variant="outline" size="md" onClick={onClose}>
                    Login
                  </Button>
                  <Button to="/register" variant="dark" size="md" onClick={onClose}>
                    Sign up
                  </Button>
                </div>
              )}
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
