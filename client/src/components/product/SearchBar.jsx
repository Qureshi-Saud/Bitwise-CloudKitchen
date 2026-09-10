import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2 } from 'lucide-react';
import { catalogueApi } from '../../api/endpoints';
import useDebounce from '../../hooks/useDebounce';
import SmartImage from '../ui/SmartImage';
import { FoodTypeMark } from '../ui/Badge';
import { formatINR, cn } from '../../lib/utils';

const QUICK = ['Paneer', 'Chicken', 'Oats', 'Salad', 'Smoothie', 'High Protein'];

export default function SearchBar({ className, autoFocus = false, onNavigate }) {
  const [term, setTerm] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(term, 300);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    if (debounced.trim().length < 2) {
      setResults([]);
      return undefined;
    }
    setLoading(true);
    catalogueApi
      .suggestions(debounced.trim())
      .then((res) => { if (!cancelled) setResults(res.data); })
      .catch(() => { if (!cancelled) setResults([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced]);

  useEffect(() => {
    const onClick = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (path) => {
    setOpen(false);
    setTerm('');
    onNavigate?.();
    navigate(path);
  };

  const submit = (e) => {
    e.preventDefault();
    if (term.trim()) go('/menu?search=' + encodeURIComponent(term.trim()));
  };

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <form onSubmit={submit} role="search">
        <div className="relative">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-charcoal/35" />
          <input
            type="search"
            value={term}
            autoFocus={autoFocus}
            onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="What are you craving?"
            aria-label="Search snacks"
            className="input rounded-full pl-11 pr-11"
          />
          {loading ? (
            <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-brand-600" />
          ) : term ? (
            <button
              type="button"
              onClick={() => { setTerm(''); setResults([]); }}
              aria-label="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal/35 hover:text-charcoal"
            >
              <X size={16} />
            </button>
          ) : null}
        </div>
      </form>

      {open && (
        <div className="absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-pop">
          {term.trim().length < 2 ? (
            <div className="p-4">
              <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-charcoal/40">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {QUICK.map((q) => (
                  <button
                    key={q}
                    onClick={() => go('/menu?search=' + encodeURIComponent(q))}
                    className="chip-neutral transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : results.length ? (
            <ul className="max-h-[22rem] overflow-y-auto py-1.5">
              {results.map((p) => (
                <li key={p._id}>
                  <button
                    onClick={() => go('/menu/' + p.slug)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-cream"
                  >
                    <SmartImage
                      src={p.images?.[0]?.url}
                      alt={p.name}
                      width={120}
                      wrapperClassName="h-12 w-12 shrink-0 rounded-xl"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <FoodTypeMark type={p.foodType} size={12} />
                        <span className="truncate text-sm font-semibold">{p.name}</span>
                      </span>
                      <span className="mt-0.5 block text-xs text-charcoal/50">
                        {Math.round(p.nutrition?.calories || 0)} kcal &middot; {Math.round(p.nutrition?.protein || 0)}g protein
                      </span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-brand-700">{formatINR(p.price)}</span>
                  </button>
                </li>
              ))}
              <li className="border-t border-black/5 pt-1">
                <button
                  onClick={submit}
                  className="w-full px-4 py-2.5 text-left text-sm font-semibold text-brand-700 hover:bg-cream"
                >
                  See all results for &quot;{term}&quot;
                </button>
              </li>
            </ul>
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-sm font-semibold">No snacks matched &quot;{term}&quot;</p>
              <p className="mt-1 text-xs text-charcoal/50">Try paneer, oats, salad, smoothie or high protein.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
