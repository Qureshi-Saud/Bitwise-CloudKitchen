import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, MessageCircle, Instagram, Facebook, Youtube, Linkedin, Twitter, Clock } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import BrandLogo from '../ui/BrandLogo';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: 'Home', to: '/' },
      { label: 'About Us', to: '/about' },
      { label: 'Full Menu', to: '/menu' },
      { label: 'Build a Snack Box', to: '/snack-box' },
      { label: 'Customize Your Snack', to: '/customize' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Nutrition Guide', to: '/nutrition' },
      { label: 'Track Your Order', to: '/track-order' },
      { label: 'FAQ', to: '/faq' },
      { label: 'Contact Us', to: '/contact' },
      { label: 'My Orders', to: '/account/orders' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms & Conditions', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Refund & Cancellation', to: '/refund-policy' },
      { label: 'Shipping & Delivery', to: '/shipping-policy' },
    ],
  },
];

/* Icons for the social profiles the admin can fill in. A blank URL hides the icon. */
const SOCIAL_ICONS = [
  { key: 'instagram', icon: Instagram, label: 'Instagram' },
  { key: 'facebook', icon: Facebook, label: 'Facebook' },
  { key: 'twitter', icon: Twitter, label: 'X (Twitter)' },
  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn' },
  { key: 'youtube', icon: Youtube, label: 'YouTube' },
];

export default function Footer() {
  const settings = useSettings();
  const socials = SOCIAL_ICONS.filter((s) => settings.socials?.[s.key]);

  return (
    <footer className="mt-auto bg-charcoal text-white/70">
      <div className="container py-10 sm:py-14">
        <div className="grid gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <BrandLogo size={44} className="h-11 w-11" />
              <span className="leading-tight">
                <span className="block font-display text-base font-extrabold text-white">{settings.brandName}</span>
                <span className="block text-xs text-brand-400">{settings.tagline}</span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              A cloud kitchen built around one idea: snacking should be fresh, honest and affordable.
              Order individual snacks whenever you want, from {settings.city}. No plans, no subscriptions,
              no commitments - just good food, made to order.
            </p>

            <div className="mt-5 space-y-2.5 text-sm">
              {settings.supportPhone && (
                <a href={settings.telLink} className="flex items-center gap-2.5 hover:text-white">
                  <Phone size={15} className="text-brand-400" /> {settings.supportPhone}
                </a>
              )}
              {settings.supportEmail && (
                <a href={settings.mailtoLink} className="flex items-center gap-2.5 hover:text-white">
                  <Mail size={15} className="text-brand-400" /> {settings.supportEmail}
                </a>
              )}
              {settings.whatsappLink && (
                <a href={settings.whatsappLink} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 hover:text-white">
                  <MessageCircle size={15} className="text-brand-400" /> Order on WhatsApp
                </a>
              )}
              {settings.address && (
                <p className="flex items-center gap-2.5">
                  <MapPin size={15} className="text-brand-400" /> {settings.address}
                </p>
              )}
              {settings.supportHours && (
                <p className="flex items-center gap-2.5">
                  <Clock size={15} className="text-brand-400" /> {settings.supportHours}
                </p>
              )}
            </div>

            <div className="mt-5 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={settings.socials[s.key]}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-brand-600 hover:text-white"
                >
                  <s.icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">{col.title}</h3>
              <ul className="space-y-2.5 text-sm">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link to={l.to} className="transition hover:text-white">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-white/[.06] px-4 py-4 text-xs leading-relaxed sm:px-5">
          <strong className="text-white">A note on nutrition:</strong> Nutrition values shown across this website are
          approximate and may vary according to ingredients, preparation method and portion size. We share this
          information for transparency only and make no medical, disease-treatment or therapeutic claims. For any
          allergy or medical condition, please consult a qualified doctor or a registered dietitian.
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/10 pt-6 text-center text-xs sm:flex-row sm:text-left">
          <p>&copy; {new Date().getFullYear()} {settings.brandName}. All rights reserved.</p>
          <p>Made fresh in {settings.city} &middot; FSSAI-compliant cloud kitchen</p>
        </div>
      </div>
    </footer>
  );
}
