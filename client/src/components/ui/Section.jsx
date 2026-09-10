import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export function SectionHeading({ eyebrow, title, subtitle, align = 'center', invert = false, className }) {
  return (
    <div className={cn('mb-8 max-w-2xl sm:mb-10', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <span className={cn('mb-3', invert ? 'chip-invert' : 'chip-eyebrow')}>{eyebrow}</span>}
      <h2 className="h-section">{title}</h2>
      {subtitle && (
        <p className={cn('mt-3 text-sm leading-relaxed sm:text-base', invert ? 'text-white/75' : 'text-charcoal/65')}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Fades content up as it scrolls into view; respects reduced-motion via CSS. */
export function Reveal({ children, delay = 0, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Vertical rhythm. `pad` replaces the `!py-8 sm:!py-12` style overrides that had
   accumulated three different values across the pages. */
const PADS = {
  default: 'section',
  tight: 'py-6 sm:py-10 lg:py-12',
  flush: 'pt-8 pb-10 sm:pt-10 sm:pb-14 lg:pb-20',
  'flush-top': 'pt-0 pb-10 sm:pb-14 lg:pb-20',
};

export default function Section({ children, className, id, pad = 'default' }) {
  return (
    <section id={id} className={cn(PADS[pad] || PADS.default, className)}>
      <div className="container">{children}</div>
    </section>
  );
}

/**
 * The full-width "order now" card that closes the home, about and nutrition
 * pages. The three copies had drifted into two gradient directions, two heading
 * sizes and two paddings.
 */
export function CtaCard({ title, children, actions, className }) {
  return (
    <div
      className={cn(
        'card bg-gradient-to-br from-brand-50 to-carrot-50 p-6 text-center sm:p-10 lg:p-12',
        className
      )}
    >
      <h2 className="mx-auto max-w-2xl h-section">{title}</h2>
      {children && <p className="mx-auto mt-4 max-w-xl leading-relaxed text-charcoal/65">{children}</p>}
      {actions && <div className="mt-7 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}
