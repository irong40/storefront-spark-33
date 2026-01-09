import { useFeaturedProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';

const productEmojis: Record<string, string> = {
  'green-goddess': '🥬',
  'golden-hour': '🥕',
  'berry-bliss': '🫐',
  'citrus-sunrise': '🍊',
  'tropical-thunder': '🥭',
  'immunity-shot': '🧡',
  'ginger-snap': '🫚',
};

export function FeaturedProducts() {
  const { data: products, isLoading } = useFeaturedProducts();
  const { addItem } = useCart();

  const getEmoji = (slug: string) => {
    return productEmojis[slug] || '🧃';
  };

  return (
    <section className="py-24 bg-card relative">
      {/* Gradient overlay from background */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-background to-transparent pointer-events-none" />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="label-text block mb-3">Customer Favorites</span>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-brand-brown mb-3">
            Our Best Sellers
          </h2>
          <p className="font-script text-2xl text-brand-berry">
            Pressed to perfection
          </p>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-background rounded-3xl p-6">
                <Skeleton className="w-28 h-36 mx-auto mb-4 rounded-2xl" />
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products?.map((product, index) => (
              <div
                key={product.id}
                className="group bg-background rounded-3xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-lifted relative overflow-hidden"
              >
                {/* Top gradient border on hover */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-berry to-brand-mustard transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                {/* Image placeholder */}
                <Link to={`/products/${product.slug}`}>
                  <div className="relative w-28 h-36 mx-auto mb-4 bg-gradient-to-br from-brand-cream-dark to-brand-terracotta rounded-2xl flex items-center justify-center text-5xl">
                    {getEmoji(product.slug)}
                    {index === 0 && (
                      <span className="absolute -top-2 -right-2 bg-brand-berry text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        Popular
                      </span>
                    )}
                    {index === 3 && (
                      <span className="absolute -top-2 -right-2 bg-brand-olive text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">
                        New
                      </span>
                    )}
                  </div>
                </Link>

                {/* Product info */}
                <Link to={`/products/${product.slug}`}>
                  <h3 className="font-display text-xl font-semibold text-brand-brown mb-1">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-brand-warm-gray mb-4 line-clamp-1">
                  {product.ingredients || product.short_description}
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="font-display text-2xl font-semibold text-brand-olive">
                    ${product.price.toFixed(2)}
                    <span className="text-sm text-brand-warm-gray font-normal"> / 16oz</span>
                  </div>
                <Button
                    size="icon"
                    className="rounded-full bg-brand-berry hover:bg-brand-berry-dark hover:scale-110 transition-all"
                    onClick={() => addItem(product.id)}
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-2 border-brand-olive text-brand-olive hover:bg-brand-olive hover:text-white font-semibold">
            <Link to="/products">
              View Full Menu
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
