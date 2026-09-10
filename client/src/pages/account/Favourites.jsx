import { Heart } from 'lucide-react';
import ProductCard from '../../components/product/ProductCard';
import EmptyState from '../../components/ui/EmptyState';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';

export default function Favourites() {
  const { user } = useAuth();
  const { addItem } = useCart();
  const toast = useToast();

  const favourites = user.favourites || [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="h-sub">Favourites</h1>
        <p className="mt-1 text-sm text-charcoal/55">
          The snacks you saved. Tap the heart on any product page to add one here.
        </p>
      </header>

      {favourites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favourites yet"
          description="Save the snacks you keep coming back to and reorder them in one tap."
          actionLabel="Browse the menu"
          actionTo="/menu"
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {favourites.map((p, i) => (
            <ProductCard
              key={p._id}
              product={p}
              index={i}
              onAdd={(prod) => {
                addItem({
                  kind: 'product',
                  productId: prod._id,
                  quantity: 1,
                  customizations: [],
                  meta: { name: prod.name, image: prod.images?.[0]?.url },
                });
                toast.success(prod.name + ' added to your cart');
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
