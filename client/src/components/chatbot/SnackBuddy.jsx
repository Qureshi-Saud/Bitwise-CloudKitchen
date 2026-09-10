import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react';
import { chatbotApi } from '../../api/endpoints';
import { formatINR, cn } from '../../lib/utils';
import SmartImage from '../ui/SmartImage';
import { FoodTypeMark } from '../ui/Badge';

const SESSION_KEY = 'bitewise.chat.session';

const getSessionId = () => {
  let id = null;
  try {
    id = localStorage.getItem(SESSION_KEY);
  } catch (e) {
    /* private mode */
  }
  if (!id) {
    id = 'sb-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    try {
      localStorage.setItem(SESSION_KEY, id);
    } catch (e) {
      /* ignore */
    }
  }
  return id;
};

export default function SnackBuddy() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [booted, setBooted] = useState(false);
  const scrollRef = useRef(null);
  const sessionId = useRef(getSessionId());

  useEffect(() => {
    if (!open || booted) return;
    setBooted(true);
    chatbotApi
      .welcome()
      .then((res) => {
        setMessages([{ role: 'assistant', text: res.data.greeting, products: [] }]);
        setSuggestions(res.data.suggestions || []);
      })
      .catch(() => {
        setMessages([
          {
            role: 'assistant',
            text: 'Hi! I am Snack Buddy. I could not reach the kitchen just now - please try again in a moment.',
            products: [],
          },
        ]);
      });
  }, [open, booted]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text) => {
    const value = (text ?? input).trim();
    if (!value || sending) return;

    setMessages((m) => [...m, { role: 'user', text: value }]);
    setInput('');
    setSending(true);

    try {
      const res = await chatbotApi.send(value, sessionId.current);
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: res.data.reply, products: res.data.products || [], link: res.data.link },
      ]);
      if (res.data.quickReplies?.length) setSuggestions(res.data.quickReplies);
    } catch (err) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: err.message || 'Something went wrong. Please try again.', products: [] },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? 'Close Snack Buddy' : 'Chat with Snack Buddy'}
        className={cn(
          'bottom-safe-5 fixed right-4 z-[60] grid h-12 w-12 place-items-center rounded-full text-white shadow-pop transition-transform hover:scale-105 active:scale-95 sm:right-5 sm:h-14 sm:w-14',
          open ? 'bg-charcoal' : 'bg-brand-600'
        )}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-carrot-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-carrot-500" />
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="bottom-safe-24 fixed inset-x-4 z-[60] mx-auto flex h-[min(34rem,calc(100dvh-9rem))] max-w-sm flex-col overflow-hidden rounded-3xl border border-black/5 bg-white shadow-pop sm:inset-x-auto sm:right-5 sm:mx-0"
            role="dialog"
            aria-label="Snack Buddy chat"
          >
            <header className="flex items-center gap-3 bg-brand-700 px-4 py-3.5 text-white">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
                <Sparkles size={18} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-bold">Snack Buddy</p>
                <p className="flex items-center gap-1.5 text-[11px] text-white/75">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-300" />
                  Menu, nutrition &amp; order help
                </p>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-cream p-4">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
                      m.role === 'user'
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md bg-white text-charcoal'
                    )}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>

                    {m.products?.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {m.products.map((p) => (
                          <Link
                            key={p._id}
                            to={'/menu/' + p.slug}
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 rounded-xl bg-cream p-2 transition hover:bg-brand-50"
                          >
                            <SmartImage
                              src={p.images?.[0]?.url}
                              alt=""
                              width={100}
                              wrapperClassName="h-10 w-10 shrink-0 rounded-lg"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1">
                                <FoodTypeMark type={p.foodType} size={10} />
                                <span className="truncate text-xs font-bold">{p.name}</span>
                              </span>
                              <span className="text-[10px] text-charcoal/50">
                                {Math.round(p.nutrition?.calories || 0)} kcal &middot;{' '}
                                {Math.round(p.nutrition?.protein || 0)}g protein
                              </span>
                            </span>
                            <span className="shrink-0 text-xs font-bold text-brand-700">{formatINR(p.price)}</span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {m.link && (
                      <Link
                        to={m.link}
                        onClick={() => setOpen(false)}
                        className="mt-2.5 inline-block text-xs font-bold text-brand-700 underline underline-offset-2"
                      >
                        Open that page
                      </Link>
                    )}
                  </div>
                </div>
              ))}

              {sending && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                    <Loader2 size={14} className="animate-spin text-brand-600" />
                    <span className="text-xs text-charcoal/50">Snack Buddy is typing...</span>
                  </div>
                </div>
              )}
            </div>

            {suggestions.length > 0 && !sending && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-black/5 bg-white px-3 py-2.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="chip-soft shrink-0 whitespace-nowrap transition hover:bg-brand-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="flex items-center gap-2 border-t border-black/5 bg-white p-3 pb-safe-4 sm:pb-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about menu, nutrition, orders..."
                aria-label="Message Snack Buddy"
                maxLength={500}
                className="input rounded-full py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                aria-label="Send message"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
