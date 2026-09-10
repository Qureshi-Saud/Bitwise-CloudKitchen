import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X } from 'lucide-react';
import Section from '../components/ui/Section';
import PageHeader from '../components/ui/PageHeader';
import Button from '../components/ui/Button';
import ProductCard from '../components/product/ProductCard';
import FilterPanel from '../components/product/FilterPanel';
import CustomizeDialog from '../components/product/CustomizeDialog';
import SearchBar from '../components/product/SearchBar';
import EmptyState from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { ProductGridSkeleton } from '../components/ui/Skeleton';
import { catalogueApi } from '../api/endpoints';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { SORT_OPTIONS, DIET_FILTERS } from '../lib/constants';

/** URL search params are the single source of truth, so filters are shareable. */
const paramsToFilters = (params) => ({
  search: params.get('search') || undefined,
  categories: params.get('categories')?.split(',').filter(Boolean) || [],
  tags: params.get('tags')?.split(',').filter(Boolean) || [],
  foodType: params.get('foodType') || 'all',
  priceBand: params.get('priceBand') || undefined,
  sort: params.get('sort') || 'popular',
  page: Number(params.get('page')) || 1,
  limit: Number(params.get('limit')) || 12,
});

const filtersToParams = (f) => {
  const p = {};
  if (f.search) p.search = f.search;
  if (f.categories?.length) p.categories = f.categories.join(',');
  if (f.tags?.length) p.tags = f.tags.join(',');
  if (f.foodType && f.foodType !== 'all') p.foodType = f.foodType;
  if (f.priceBand) p.priceBand = f.priceBand;
  if (f.sort && f.sort !== 'popular') p.sort = f.sort;
  if (f.page && f.page > 1) p.page = String(f.page);
  if (f.limit && f.limit !== 12) p.limit = String(f.limit);
  return p;
};

export default function Menu() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => paramsToFilters(searchParams), [searchParams]);

  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customizing, setCustomizing] = useState(null);

  const { addItem } = useCart();
  const toast = useToast();

  useEffect(() => {
    catalogueApi.categories().then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    catalogueApi
      .products({ ...filtersToParams(filters), limit: filters.limit, page: filters.page })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.data);
        setMeta(res.meta);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [filters]);

  const update = useCallback(
    (next) => {
      setSearchParams(filtersToParams(next), { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [setSearchParams]
  );

  const reset = () => setSearchParams({}, { replace: true });

  const quickAdd = (product) => {
    addItem({
      kind: 'product',
      productId: product._id,
      quantity: 1,
      customizations: [],
      meta: { name: product.name, image: product.images?.[0]?.url },
    });
    toast.success(product.name + ' added to your cart');
  };

  const activeChips = [
    ...(filters.categories || []).map((slug) => ({
      key: 'cat:' + slug,
      label: categories.find((c) => c.slug === slug)?.name || slug,
      remove: () => update({ ...filters, categories: filters.categories.filter((c) => c !== slug), page: 1 }),
    })),
    ...(filters.tags || []).map((tag) => ({
      key: 'tag:' + tag,
      label: DIET_FILTERS.find((d) => d.key === tag)?.label || tag,
      remove: () => update({ ...filters, tags: filters.tags.filter((t) => t !== tag), page: 1 }),
    })),
    ...(filters.foodType && filters.foodType !== 'all'
      ? [{
          key: 'food',
          label: filters.foodType === 'veg' ? 'Vegetarian' : 'Non-vegetarian',
          remove: () => update({ ...filters, foodType: 'all', page: 1 }),
        }]
      : []),
    ...(filters.priceBand
      ? [{ key: 'price', label: filters.priceBand, remove: () => update({ ...filters, priceBand: undefined, page: 1 }) }]
      : []),
    ...(filters.search
      ? [{ key: 'search', label: '"' + filters.search + '"', remove: () => update({ ...filters, search: undefined, page: 1 }) }]
      : []),
  ];

  return (
    <>
      <PageHeader
        tone="plain"
        title="Our Menu"
        subtitle="Six categories, fifteen fresh snacks, full nutrition on every card. Order individual items whenever you like - no plans and no subscriptions."
      >
        <div className="mt-6 max-w-xl">
          <SearchBar />
        </div>
      </PageHeader>

      <Section pad="tight">
        <div className="flex gap-6 xl:gap-8">
          <div className="hidden w-64 shrink-0 lg:block xl:w-72">
            <div className="no-scrollbar sticky top-[calc(var(--header-h)+1.5rem)] max-h-[calc(100vh-var(--header-h)-3rem)] overflow-y-auto rounded-3xl border border-black/5 bg-white p-5">
              <FilterPanel
                categories={categories}
                filters={filters}
                onChange={update}
                onReset={reset}
                resultCount={meta?.total}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-charcoal/60">
                {loading ? 'Finding snacks...' : (meta?.total || 0) + ' snacks available'}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={SlidersHorizontal}
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden"
                >
                  Filters
                  {activeChips.length > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1 text-[10px] text-white">
                      {activeChips.length}
                    </span>
                  )}
                </Button>

                <select
                  value={filters.sort}
                  onChange={(e) => update({ ...filters, sort: e.target.value, page: 1 })}
                  aria-label="Sort snacks"
                  className="input w-auto rounded-full py-2 text-sm"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {activeChips.length > 0 && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    onClick={chip.remove}
                    className="chip-soft transition hover:bg-brand-100"
                  >
                    {chip.label} <X size={12} />
                  </button>
                ))}
                <button onClick={reset} className="text-xs font-semibold text-charcoal/50 underline underline-offset-2 hover:text-charcoal">
                  Clear all
                </button>
              </div>
            )}

            {loading ? (
              <ProductGridSkeleton count={9} cols="sm:grid-cols-2 xl:grid-cols-3" />
            ) : products.length === 0 ? (
              <EmptyState
                title="No snacks matched those filters"
                description="Try widening your price range, clearing a nutrition filter, or searching for something like paneer, oats or smoothie."
                actionLabel="Clear all filters"
                onAction={reset}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {products.map((p, i) => (
                    <ProductCard key={p._id} product={p} index={i} onAdd={quickAdd} onCustomize={setCustomizing} />
                  ))}
                </div>

                {meta && (
                  <Pagination
                    className="mt-10"
                    page={meta.page}
                    totalPages={meta.totalPages}
                    pageSize={filters.limit}
                    total={meta.total}
                    label="Snacks per page:"
                    onPageChange={(page) => update({ ...filters, page })}
                    onPageSizeChange={(limit) => update({ ...filters, limit, page: 1 })}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </Section>

      {drawerOpen && (
        <div className="fixed inset-0 z-[85] lg:hidden">
          <div className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="max-h-dvh-85 absolute inset-x-0 bottom-0 flex flex-col overflow-y-auto overscroll-contain rounded-t-3xl bg-white p-4 pb-safe-4 sm:p-5">
            <FilterPanel
              categories={categories}
              filters={filters}
              onChange={update}
              onReset={reset}
              onClose={() => setDrawerOpen(false)}
              resultCount={meta?.total}
            />
            <Button onClick={() => setDrawerOpen(false)} size="lg" className="mt-4 w-full shrink-0">
              Show {meta?.total || 0} snacks
            </Button>
          </div>
        </div>
      )}

      <CustomizeDialog
        product={customizing}
        open={Boolean(customizing)}
        onClose={() => setCustomizing(null)}
        onAddToCart={(item) => {
          addItem(item);
          toast.success('Added to your cart');
        }}
      />
    </>
  );
}
