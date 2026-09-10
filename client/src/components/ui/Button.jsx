import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const VARIANTS = {
  primary: 'btn-primary',
  accent: 'btn-accent',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  dark: 'btn bg-charcoal text-white hover:bg-charcoal/90 shadow-lift',
  white: 'btn bg-white text-charcoal hover:bg-white/90 shadow-lift',
};

const SIZES = { sm: 'btn-sm', md: 'btn-md', lg: 'btn-lg' };

export default function Button({
  as, to, href, variant = 'primary', size = 'md', loading = false,
  icon: Icon, iconRight: IconRight, className, children, disabled, ...rest
}) {
  const classes = cn(VARIANTS[variant], SIZES[size], className);
  const content = (
    <>
      {loading ? <Loader2 size={18} className="animate-spin" /> : Icon ? <Icon size={18} /> : null}
      {children}
      {!loading && IconRight ? <IconRight size={18} /> : null}
    </>
  );

  if (to) return <Link to={to} className={classes} {...rest}>{content}</Link>;
  if (href) return <a href={href} className={classes} {...rest}>{content}</a>;

  const Tag = as || 'button';
  return (
    <Tag className={classes} disabled={disabled || loading} {...rest} type={Tag === 'button' ? rest.type || 'button' : rest.type}>
      {content}
    </Tag>
  );
}

const ICON_SIZES = { sm: 'h-8 w-8', md: 'h-9 w-9', lg: 'h-10 w-10' };

/**
 * A circular icon-only control: dialog close buttons, the navbar actions, the
 * remove-line button. These were hand-rolled a dozen times with three different
 * hover treatments, and an icon-only button always needs an accessible name.
 */
export function IconButton({ icon: Icon, label, size = 'md', to, href, tone = 'default', className, ...rest }) {
  const classes = cn(
    'grid shrink-0 place-items-center rounded-full transition',
    ICON_SIZES[size] || ICON_SIZES.md,
    tone === 'danger'
      ? 'text-charcoal/40 hover:bg-red-50 hover:text-red-600'
      : 'text-charcoal/60 hover:bg-black/5 hover:text-charcoal',
    className
  );
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 19 : 18;
  const content = <Icon size={iconSize} />;

  if (to) return <Link to={to} aria-label={label} className={classes} {...rest}>{content}</Link>;
  if (href) return <a href={href} aria-label={label} className={classes} {...rest}>{content}</a>;
  return <button type="button" aria-label={label} className={classes} {...rest}>{content}</button>;
}
