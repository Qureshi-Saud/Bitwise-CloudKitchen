import { memo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, SlidersHorizontal, Clock } from 'lucide-react';
import SmartImage from '../ui/SmartImage';
import Badge, { FoodTypeMark } from '../ui/Badge';
import Rating from '../ui/Rating';
import NutritionStrip from './NutritionStrip';
import Button from '../ui/Button';
import { formatINR, truncate } from '../../lib/utils';

function ProductCard({ product, onAdd, onCustomize, index = 0 }) {
  const soldOut = !product.isAvailable || product.stockStatus === 'out-of-stock';

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.04 }}
      className="card group flex flex-col overflow-hidden transition-shadow hover:shadow-pop"
    >
      <Link to={'/menu/' + product.slug} className="relative block" aria-label={product.name}>
        <SmartImage
          src={product.images?.[0]?.url}
          alt={product.images?.[0]?.alt || product.name}
          width={600}
          wrapperClassName="aspect-[4/3]"
          className="transition-transform duration-500 group-hover:scale-[1.06]"
        />

        <div className="absolute left-3 top-3 flex items-center gap-2">
          <span className="rounded-lg bg-white/95 p-1 shadow-sm backdrop-blur">
            <FoodTypeMark type={product.foodType} size={14} />
          </span>
          {product.isPopular && (
            <span className="chip bg-carrot-500 text-white shadow-sm">Popular</span>
          )}
        </div>

        {product.reviewCount > 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2 py-1 shadow-sm backdrop-blur">
            <Rating value={product.rating} count={product.reviewCount} />
          </span>
        )}

        {soldOut && (
          <div className="absolute inset-0 grid place-items-center bg-charcoal/55 backdrop-blur-[2px]">
            <span className="rounded-full bg-white px-4 py-2 text-sm font-bold">Sold out for today</span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-base font-bold leading-snug">
            <Link to={'/menu/' + product.slug} className="hover:text-brand-700">{product.name}</Link>
          </h3>
          <span className="shrink-0 text-lg font-extrabold text-brand-700">{formatINR(product.price)}</span>
        </div>

        <p className="mt-1.5 text-sm leading-relaxed text-charcoal/60">
          {truncate(product.shortDescription, 92)}
        </p>

        {product.badges?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {product.badges.slice(0, 3).map((b) => <Badge key={b}>{b}</Badge>)}
          </div>
        )}

        <NutritionStrip nutrition={product.nutrition} className="mt-3.5" compact />

        <div className="mt-2.5 flex items-center gap-1.5 text-xs text-charcoal/45">
          <Clock size={13} />
          <span>Ready in ~{product.prepTimeMinutes || 15} min</span>
          {product.servingSize && <span>&middot; {product.servingSize}</span>}
        </div>

        <div className="mt-4 flex flex-wrap gap-2 pt-1">
          {product.isCustomizable && (
            <Button
              variant="outline"
              size="sm"
              icon={SlidersHorizontal}
              onClick={() => onCustomize?.(product)}
              disabled={soldOut}
              className="grow basis-[8.5rem]"
            >
              Customize
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => onAdd?.(product)}
            disabled={soldOut}
            className={product.isCustomizable ? 'grow basis-[8.5rem]' : 'w-full'}
          >
            Add to Cart
          </Button>
        </div>
      </div>
    </motion.article>
  );
}

export default memo(ProductCard);
