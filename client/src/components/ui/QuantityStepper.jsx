import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

/*
 * The rounded -/+ stepper used by the cart, the drawer, the product page, the
 * customise dialog and the snack-box builder. It was previously copy-pasted six
 * times in four different sizes, and half of the copies gave no disabled
 * affordance when you hit the minimum.
 */
const SIZES = {
  sm: { pad: 'p-0.5', btn: 'h-6 w-6', icon: 12, value: 'w-5 text-xs' },
  md: { pad: 'p-1', btn: 'h-8 w-8', icon: 14, value: 'w-7 text-sm' },
  lg: { pad: 'p-1', btn: 'h-9 w-9', icon: 16, value: 'w-8 text-base' },
};

export default function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = Infinity,
  size = 'md',
  label = 'quantity',
  solid = false,
  className,
}) {
  const s = SIZES[size] || SIZES.md;
  const btn = cn(
    'grid place-items-center rounded-full transition hover:bg-black/5',
    'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent',
    s.btn
  );

  return (
    <div
      className={cn(
        'flex items-center gap-1 rounded-full border border-black/10',
        s.pad,
        solid && 'bg-white',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={'Decrease ' + label}
        className={btn}
      >
        <Minus size={s.icon} />
      </button>

      <span aria-live="polite" className={cn('text-center font-bold', s.value)}>
        {value}
      </span>

      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label={'Increase ' + label}
        className={btn}
      >
        <Plus size={s.icon} />
      </button>
    </div>
  );
}
