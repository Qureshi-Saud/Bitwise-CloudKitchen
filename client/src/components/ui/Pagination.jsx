import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * The storefront twin of the admin table pagination bar, so a customer and an
 * operator read the same control.
 *
 * Left:  "Rows per page: [n]"  +  the visible range out of the total.
 * Right: "Page x of y"  +  first / prev / current / next / last controls.
 *
 * Pages are 1-based here, matching the API and the `?page=` search param.
 */

const navButton =
  'grid h-8 w-8 place-items-center rounded-full border border-black/10 bg-white text-charcoal/60 transition ' +
  'hover:border-brand-400 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-black/10';

export default function Pagination({
  page,
  totalPages,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [12, 24, 48],
  label = 'Rows per page:',
  className,
}) {
  const lastPage = Math.max(totalPages, 1);
  const current = Math.min(Math.max(page, 1), lastPage);
  const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
  const to = Math.min(total, current * pageSize);

  const go = (next) => () => onPageChange(Math.min(Math.max(next, 1), lastPage));

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-black/5 bg-cream px-4 py-3',
        className
      )}
    >
      {/* ------------------------------ Left ------------------------------ */}
      <div className="flex items-center gap-3 text-sm text-charcoal/60">
        {onPageSizeChange && (
          <>
            <span>{label}</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label={label}
              className="rounded-lg border border-black/10 bg-white px-2 py-1 text-sm font-semibold text-charcoal outline-none transition focus:border-brand-400"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </>
        )}

        <span>
          {from}–{to} of <strong className="font-bold text-charcoal">{total}</strong>
        </span>
      </div>

      {/* ------------------------------ Right ----------------------------- */}
      <div className="flex items-center gap-2">
        <span className="mr-1 text-sm text-charcoal/60">
          Page <strong className="font-bold text-charcoal">{current}</strong> of{' '}
          <strong className="font-bold text-charcoal">{lastPage}</strong>
        </span>

        <button type="button" className={navButton} disabled={current === 1} onClick={go(1)} aria-label="First page">
          <ChevronsLeft size={16} />
        </button>
        <button type="button" className={navButton} disabled={current === 1} onClick={go(current - 1)} aria-label="Previous page">
          <ChevronLeft size={16} />
        </button>

        <span
          aria-current="page"
          className="grid h-8 w-8 place-items-center rounded-full bg-brand-600 text-[13px] font-bold text-white"
        >
          {current}
        </span>

        <button type="button" className={navButton} disabled={current === lastPage} onClick={go(current + 1)} aria-label="Next page">
          <ChevronRight size={16} />
        </button>
        <button type="button" className={navButton} disabled={current === lastPage} onClick={go(lastPage)} aria-label="Last page">
          <ChevronsRight size={16} />
        </button>
      </div>
    </nav>
  );
}
