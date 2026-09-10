import { cn } from '../../lib/utils';

/*
 * The selectable pill used by every filter surface: the menu filter panel, the
 * nutrition comparison filters, the snack-box category rail and the order-status
 * rail. Five copies had drifted into four different inactive/hover states, and
 * three of them never announced their pressed state to a screen reader.
 */
export default function ChipToggle({ active, children, className, ...rest }) {
  return (
    <button
      type="button"
      aria-pressed={Boolean(active)}
      className={cn(
        'chip shrink-0 whitespace-nowrap border transition',
        active
          ? 'border-brand-600 bg-brand-600 text-white'
          : 'border-black/10 bg-white text-charcoal/70 hover:border-brand-300 hover:text-brand-700',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
