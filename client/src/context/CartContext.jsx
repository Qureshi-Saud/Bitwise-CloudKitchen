import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { orderApi } from '../api/endpoints';
import { cartLineId } from '../lib/utils';

const CartContext = createContext(null);
const STORAGE_KEY = 'bitewise.cart.v1';

const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export function CartProvider({ children }) {
  // `items` holds only the customer's INTENT (ids, quantities, option ids).
  // Every price shown comes from the server quote, never from the browser.
  const [items, setItems] = useState(readStored);
  const [quote, setQuote] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) { /* quota */ }
  }, [items]);

  /* ----------------------- Server-authoritative pricing ---------------------- */
  useEffect(() => {
    if (!items.length) {
      setQuote(null);
      setQuoteError(null);
      return undefined;
    }

    const id = ++requestId.current;
    setIsQuoting(true);

    const timer = setTimeout(async () => {
      try {
        const payload = {
          items: items.map(({ lineId, meta, ...rest }) => rest),
          ...(couponCode ? { couponCode } : {}),
        };
        const res = await orderApi.quote(payload);
        if (id === requestId.current) {
          setQuote(res.data);
          setQuoteError(null);
        }
      } catch (err) {
        if (id === requestId.current) {
          setQuoteError(err.message);
          // A bad coupon must not block the cart - drop it and re-quote.
          if (couponCode) setCouponCode('');
        }
      } finally {
        if (id === requestId.current) setIsQuoting(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [items, couponCode]);

  const addItem = useCallback((item) => {
    const lineId = cartLineId(item);
    setItems((list) => {
      const existing = list.find((l) => l.lineId === lineId);
      if (existing) {
        return list.map((l) =>
          l.lineId === lineId ? { ...l, quantity: Math.min(l.quantity + (item.quantity || 1), 20) } : l
        );
      }
      return [...list, { ...item, lineId, quantity: item.quantity || 1 }];
    });
    setIsOpen(true);
    return lineId;
  }, []);

  const updateQuantity = useCallback((lineId, quantity) => {
    setItems((list) =>
      quantity <= 0
        ? list.filter((l) => l.lineId !== lineId)
        : list.map((l) => (l.lineId === lineId ? { ...l, quantity: Math.min(quantity, 20) } : l))
    );
  }, []);

  const removeItem = useCallback((lineId) => setItems((list) => list.filter((l) => l.lineId !== lineId)), []);

  const clearCart = useCallback(() => {
    setItems([]);
    setQuote(null);
    setCouponCode('');
  }, []);

  const itemCount = useMemo(() => items.reduce((s, i) => s + (i.quantity || 1), 0), [items]);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      quote,
      isQuoting,
      quoteError,
      couponCode,
      setCouponCode,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      // Payload shape the checkout endpoint expects.
      toOrderItems: () => items.map(({ lineId, meta, ...rest }) => rest),
    }),
    [items, itemCount, quote, isQuoting, quoteError, couponCode, addItem, updateQuantity, removeItem, clearCart, isOpen]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
};
