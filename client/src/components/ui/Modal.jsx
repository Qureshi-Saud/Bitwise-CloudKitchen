import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from './Button';
import { cn } from '../../lib/utils';

const WIDTHS = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };

export default function Modal({ open, onClose, title, description, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            className={cn(
              'max-h-dvh-92 relative flex w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-pop sm:rounded-3xl',
              WIDTHS[size]
            )}
          >
            {(title || onClose) && (
              <div className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-4 sm:px-6">
                <div className="min-w-0">
                  {title && <h3 className="text-base font-bold sm:text-lg">{title}</h3>}
                  {description && <p className="mt-1 text-xs text-charcoal/60 sm:text-sm">{description}</p>}
                </div>
                <IconButton icon={X} label="Close" onClick={onClose} />
              </div>
            )}
            <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6">{children}</div>
            {footer && (
              <div className="border-t border-black/5 bg-cream/60 px-4 py-4 pb-safe-4 sm:px-6 sm:pb-4">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
