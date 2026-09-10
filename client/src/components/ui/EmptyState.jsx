import { PackageOpen } from 'lucide-react';
import Button from './Button';
import { cn } from '../../lib/utils';

const TONES = {
  default: {
    box: 'border-black/10 bg-white/60',
    icon: 'bg-brand-50 text-brand-600',
    title: '',
    text: 'text-charcoal/60',
  },
  error: {
    box: 'border-red-200 bg-red-50',
    icon: 'bg-red-100 text-red-600',
    title: 'text-red-800',
    text: 'text-red-700/80',
  },
};

const SIZES = {
  md: 'px-5 py-12 sm:px-6 sm:py-16',
  sm: 'px-4 py-8 sm:px-5 sm:py-10',
};

/**
 * Every "there is nothing here" and "that did not work" surface on the site.
 * Four pages previously hand-rolled their own dashed box with slightly
 * different padding, text colour and corner radius.
 */
export default function EmptyState({
  icon: Icon = PackageOpen,
  title = 'Nothing here yet',
  description,
  actionLabel,
  actionTo,
  onAction,
  tone = 'default',
  size = 'md',
  className,
}) {
  const t = TONES[tone] || TONES.default;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-3xl border border-dashed text-center',
        t.box,
        SIZES[size] || SIZES.md,
        className
      )}
    >
      <div className={cn('mb-4 grid h-16 w-16 place-items-center rounded-2xl', t.icon)}>
        <Icon size={28} />
      </div>
      <h3 className={cn('text-lg font-bold', t.title)}>{title}</h3>
      {description && (
        <p className={cn('mt-2 max-w-sm text-sm leading-relaxed', t.text)}>{description}</p>
      )}
      {(actionTo || onAction) && (
        <Button to={actionTo} onClick={onAction} size="md" className="mt-6">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
