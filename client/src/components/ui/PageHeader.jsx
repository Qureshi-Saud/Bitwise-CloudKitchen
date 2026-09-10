import { cn } from '../../lib/utils';

/*
 * The single page-header used at the top of every non-marketing route.
 *
 * Before this existed the same block was hand-written on nine pages, and had
 * drifted into four paddings, three subtitle colours and two eyebrow tones.
 * Surface treatment is the only thing a page gets to choose.
 */
const TONES = {
  grain: 'bg-hero-grain',
  plain: 'border-b border-black/5 bg-white',
  dark: 'bg-brand-800 text-white',
  bare: '',
};

export default function PageHeader({
  eyebrow,
  icon: Icon,
  title,
  subtitle,
  tone = 'grain',
  actions,
  children,
  className,
}) {
  const dark = tone === 'dark';
  const bare = tone === 'bare';

  const body = (
    <>
      {eyebrow && (
        <span className={dark ? 'chip-invert' : 'chip-eyebrow'}>
          {Icon && <Icon size={13} />}
          {eyebrow}
        </span>
      )}

      <h1 className={cn('h-page', eyebrow && 'mt-4')}>{title}</h1>

      {subtitle && <p className={cn('lede', dark && 'text-white/75')}>{subtitle}</p>}

      {children}
    </>
  );

  const inner = actions ? (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">{body}</div>
      {actions}
    </div>
  ) : (
    body
  );

  if (bare) return <div className={className}>{inner}</div>;

  return (
    <div className={cn(TONES[tone], className)}>
      <div className="container py-8 sm:py-12 lg:py-16">{inner}</div>
    </div>
  );
}
