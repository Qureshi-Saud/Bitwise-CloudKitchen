import { cn } from '../../lib/utils';

/**
 * The one shimmer primitive. Everything below is a composition of it.
 *
 * Skeletons stand in for content that is on its way, so they mirror the shape
 * of what will land - a bare spinner tells the visitor nothing about that.
 * Spinners are kept for *actions* the visitor just triggered: a submitting
 * button, an in-flight search, a price being recalculated.
 */
export default function Skeleton({ className }) {
  return <div className={cn('skeleton', className)} aria-hidden="true" />;
}

/** Wraps a skeleton screen so assistive tech announces the wait exactly once. */
function SkeletonScreen({ label = 'Loading', className, children }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

const repeat = (count, fn) => Array.from({ length: count }).map((_, i) => fn(i));

/* ------------------------------- Primitives ------------------------------- */

function TextSkeleton({ lines = 3, className }) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {repeat(lines, (i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/** Stack of rounded blocks - the shape most of our lists collapse to. */
export function BlockListSkeleton({ count = 3, height = 'h-24', rounded = 'rounded-3xl', className }) {
  return (
    <div className={cn('space-y-4', className)}>
      {repeat(count, (i) => <Skeleton key={i} className={cn(height, rounded, 'w-full')} />)}
    </div>
  );
}

/* --------------------------------- Cards ---------------------------------- */

function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="space-y-3 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8, cols = 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' }) {
  return (
    <div className={cn('grid grid-cols-1 gap-5', cols)}>
      {repeat(count, (i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}

/** Compact horizontal row: thumbnail, two lines of text, trailing value. */
function MediaRowSkeleton({ className }) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <Skeleton className="h-12 w-12 shrink-0 rounded-xl" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
      <Skeleton className="h-4 w-16 shrink-0" />
    </div>
  );
}

export function MediaListSkeleton({ count = 3, divided = true, className }) {
  return (
    <ul className={cn(divided && 'divide-y divide-black/5', className)}>
      {repeat(count, (i) => (
        <li key={i} className="py-3.5 first:pt-0 last:pb-0">
          <MediaRowSkeleton />
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------ Page shells ------------------------------- */

/** Header band plus a content grid. The default fallback for a whole route. */
export function PageSkeleton({ label = 'Loading page' }) {
  return (
    <SkeletonScreen label={label}>
      <div className="container pb-10 pt-10 sm:pb-12 sm:pt-16">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Skeleton className="mx-auto h-6 w-32 rounded-full" />
          <Skeleton className="mx-auto h-10 w-3/4" />
          <Skeleton className="mx-auto h-4 w-full max-w-xl" />
          <Skeleton className="mx-auto h-4 w-2/3 max-w-md" />
        </div>
      </div>

      <div className="container py-10 sm:py-12">
        <ProductGridSkeleton count={4} />
      </div>
    </SkeletonScreen>
  );
}

/** Gallery on the left, buy panel on the right - the product page shape. */
export function ProductDetailSkeleton() {
  return (
    <SkeletonScreen label="Loading this snack" className="container py-8 sm:py-10">
      <Skeleton className="mb-8 h-3 w-56" />

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-3xl" />
          <div className="flex gap-3">
            {repeat(4, (i) => <Skeleton key={i} className="h-20 w-20 rounded-2xl" />)}
          </div>
        </div>

        <div className="space-y-5">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-4 w-32" />
          <TextSkeleton lines={3} />
          <Skeleton className="h-8 w-40" />
          <div className="flex gap-3 pt-2">
            <Skeleton className="h-12 w-36 rounded-full" />
            <Skeleton className="h-12 flex-1 rounded-full" />
          </div>
          <Skeleton className="h-28 w-full rounded-3xl" />
        </div>
      </div>
    </SkeletonScreen>
  );
}

/** Picker grid plus a summary rail - the snack box builder shape. */
export function BuilderSkeleton({ label = 'Loading' }) {
  return (
    <SkeletonScreen label={label} className="container py-8 sm:py-10">
      <div className="mx-auto mb-10 max-w-2xl space-y-4 text-center">
        <Skeleton className="mx-auto h-6 w-28 rounded-full" />
        <Skeleton className="mx-auto h-9 w-2/3" />
        <Skeleton className="mx-auto h-4 w-full" />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {repeat(6, (i) => <ProductCardSkeleton key={i} />)}
        </div>

        <div className="card space-y-4 p-5">
          <Skeleton className="h-5 w-32" />
          <MediaListSkeleton count={3} />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-12 w-full rounded-full" />
        </div>
      </div>
    </SkeletonScreen>
  );
}

/** Centred confirmation / receipt layout. */
export function ReceiptSkeleton({ label = 'Loading' }) {
  return (
    <SkeletonScreen label={label} className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-col items-center space-y-5">
        <Skeleton className="h-20 w-20 rounded-3xl" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-12 w-56 rounded-2xl" />
      </div>

      <div className="mt-10 space-y-5">
        <Skeleton className="h-40 w-full rounded-3xl" />
        <Skeleton className="h-56 w-full rounded-3xl" />
      </div>
    </SkeletonScreen>
  );
}

/** Long-form editorial page: heading band, feature tiles, then prose. */
export function ArticleSkeleton({ label = 'Loading' }) {
  return (
    <SkeletonScreen label={label}>
      <div className="container pb-10 pt-10 sm:pb-12 sm:pt-16">
        <div className="mx-auto max-w-3xl space-y-4 text-center">
          <Skeleton className="mx-auto h-6 w-40 rounded-full" />
          <Skeleton className="mx-auto h-10 w-4/5" />
          <Skeleton className="mx-auto h-4 w-full" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10 sm:px-6 sm:py-12">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {repeat(3, (i) => <Skeleton key={i} className="h-40 w-full rounded-3xl" />)}
        </div>
        <TextSkeleton lines={4} />
        <BlockListSkeleton count={4} height="h-20" rounded="rounded-2xl" />
      </div>
    </SkeletonScreen>
  );
}

/** Table-shaped rows, for the nutrition comparison grid. */
export function TableSkeleton({ rows = 6, className }) {
  return (
    <div className={cn('overflow-hidden rounded-3xl border border-black/5', className)}>
      <div className="bg-cream px-4 py-3">
        <Skeleton className="h-3 w-40" />
      </div>
      <ul className="divide-y divide-black/5 bg-white">
        {repeat(rows, (i) => (
          <li key={i} className="px-4 py-4">
            <MediaRowSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Order timeline placeholder, shown while a tracked order is fetched. */
export function TrackingSkeleton() {
  return (
    <SkeletonScreen label="Finding your order" className="mx-auto w-full max-w-4xl space-y-5">
      <div className="card space-y-5 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          {repeat(5, (i) => (
            <div key={i} className="flex flex-1 items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              {i < 4 && <Skeleton className="h-1 flex-1 rounded-full" />}
            </div>
          ))}
        </div>
        <TextSkeleton lines={2} />
      </div>

      <div className="card p-6">
        <MediaListSkeleton count={3} />
      </div>
    </SkeletonScreen>
  );
}

/** Grid of option tiles - delivery slots, payment methods, saved addresses. */
export function OptionGridSkeleton({ count = 4, className }) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      {repeat(count, (i) => <Skeleton key={i} className="h-[70px] w-full rounded-2xl" />)}
    </div>
  );
}
