import { useEffect, useState } from 'react';

/**
 * Debounced mirror of a value, used by the list pages so typing in a search box
 * does not fire a request per keystroke. Changing any other filter still
 * refetches immediately, because only the search term is debounced.
 */
export default function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    if (value === debounced) return undefined;
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay, debounced]);

  return debounced;
}
