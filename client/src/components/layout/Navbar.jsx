import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Menu, ShoppingCart, User, Search, Bell, LogOut, Package, Heart, Gift, ChevronDown, X,
} from 'lucide-react';
import { NAV_LINKS } from '../../lib/constants';
import { useSettings } from '../../context/SettingsContext';
import { cn, initials } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import SearchBar from '../product/SearchBar';
import Button, { IconButton } from '../ui/Button';
import MobileMenu from './MobileMenu';
import BrandLogo from '../ui/BrandLogo';

const ACCOUNT_LINKS = [
  { to: '/account', label: 'My Profile', icon: User },
  { to: '/account/orders', label: 'My Orders', icon: Package },
  { to: '/account/favourites', label: 'Favourites', icon: Heart },
  { to: '/account/rewards', label: 'Rewards & Referrals', icon: Gift },
];

export default function Navbar() {
  const settings = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, isAuthenticated, logout, unreadCount } = useAuth();
  const { itemCount, openCart } = useCart();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      setSearchOpen(false);
      setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const linkClass = ({ isActive }) =>
    cn(
      'relative whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition-colors',
      isActive ? 'text-brand-700' : 'text-charcoal/65 hover:bg-black/[.04] hover:text-charcoal'
    );

  return (
    <>
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 transition-all duration-300',
          scrolled ? 'bg-white/90 shadow-card backdrop-blur-xl' : 'bg-white/70 backdrop-blur-md'
        )}
      >
        <div className="container flex items-center gap-1 sm:gap-2" style={{ height: 'var(--header-h)' }}>
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label={settings.brandName + ' home'}>
            <BrandLogo size={40} className="h-9 w-9 sm:h-10 sm:w-10" />
            <span className="hidden min-w-0 leading-tight xs:block">
              <span className="block truncate font-display text-sm font-extrabold sm:text-[15px]">{settings.brandName}</span>
              <span className="block truncate text-[10px] font-medium text-brand-700 sm:text-[11px]">{settings.tagline}</span>
            </span>
          </Link>

          <nav className="mx-auto hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === '/'}>
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-3.5 bottom-1 h-0.5 rounded-full bg-brand-600"
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 lg:ml-0">
            <IconButton
              icon={searchOpen ? X : Search}
              label={searchOpen ? 'Close search' : 'Search snacks'}
              size="lg"
              aria-expanded={searchOpen}
              onClick={() => setSearchOpen((v) => !v)}
            />

            {isAuthenticated && (
              <span className="relative hidden sm:block">
                <IconButton
                  to="/account/notifications"
                  icon={Bell}
                  size="lg"
                  label={unreadCount > 0 ? 'Notifications, ' + unreadCount + ' unread' : 'Notifications'}
                />
                {unreadCount > 0 && (
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute right-1.5 top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-carrot-500 px-1 text-[10px] font-bold text-white"
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </span>
            )}

            <span className="relative block">
              <IconButton
                icon={ShoppingCart}
                size="lg"
                onClick={openCart}
                label={'Cart, ' + itemCount + (itemCount === 1 ? ' item' : ' items')}
              />
              {itemCount > 0 && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute right-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white"
                >
                  {itemCount}
                </span>
              )}
            </span>

            {isAuthenticated ? (
              <div className="relative hidden sm:block">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                  className="flex items-center gap-1.5 rounded-full py-1 pl-1 pr-2 transition hover:bg-black/5"
                >
                  {user.avatar?.url ? (
                    <img src={user.avatar.url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {initials(user.name)}
                    </span>
                  )}
                  <ChevronDown size={14} className={cn('transition', menuOpen && 'rotate-180')} />
                </button>

                <AnimatePresence>
                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.97 }}
                        className="absolute right-0 z-20 mt-2 w-[min(15rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-black/5 bg-white shadow-pop"
                      >
                        <div className="border-b border-black/5 px-4 py-3">
                          <p className="truncate text-sm font-bold">{user.name}</p>
                          <p className="truncate text-xs text-charcoal/50">{user.email}</p>
                        </div>
                        {ACCOUNT_LINKS.map((i) => (
                          <Link
                            key={i.to}
                            to={i.to}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition hover:bg-cream"
                          >
                            <i.icon size={16} className="text-charcoal/45" /> {i.label}
                          </Link>
                        ))}
                        <button
                          onClick={logout}
                          className="flex w-full items-center gap-3 border-t border-black/5 px-4 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
                        >
                          <LogOut size={16} /> Sign out
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden rounded-full px-3 py-2 text-sm font-semibold text-charcoal/70 transition hover:bg-black/5 sm:block"
              >
                Login
              </Link>
            )}

            <Button to="/menu" variant="accent" size="sm" className="hidden md:inline-flex">
              ORDER NOW
            </Button>

            <IconButton
              icon={Menu}
              label="Open menu"
              size="lg"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen(true)}
              className="lg:hidden"
            />
          </div>
        </div>

        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-black/5 bg-white"
            >
              <div className="container py-3">
                <SearchBar autoFocus onNavigate={() => setSearchOpen(false)} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
