import { useFeaturedProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AddToCartButton } from '@/components/cart/AddToCartButton';

// Keep fallback images for now if image_url is missing
const productImages: Record<string, string> = {
  // Sweet Treats
  'kiwi-kwencher': '/images/products/06-kiwi-kwencher.jpg',
  'pomegranate-pearadise': '/images/products/07-pomegranate-pearadise.jpg',
  'apple-mango-tango': '/images/products/09-apple-mango-tango.jpg',
  'very-very-green-goddess': '/images/products/11-green-goddess.jpg',
  'very-berry': '/images/products/10-very-berry.jpg',
  'summer-breeze': '/images/products/12-summer-breeze.jpg',
  // Wellness Shots
  'wellness-shot-turmeric': '/images/products/13-wellness-shot-turmeric.jpg',
  'wellness-shot-kale': '/images/products/14-wellness-shot-kale.jpg',
  'wellness-shot-ginger': '/images/products/16-wellness-shot-ginger.jpg',
  'wellness-shot-beet': '/images/products/15-wellness-shot-beet.jpg',
  // Energy & Immunity
  'glowin': '/images/products/17-glowin.jpg',
  'immunity-boost': '/images/products/18-immunity-boost.jpg',
  'ginger-ale': '/images/products/19-ginger-ale.jpg',
  'bleeding-heart': '/images/products/20-bleeding-heart.jpg',
  'beets-me': '/images/products/21-beets-me.jpg',
  // Detox & Fat Burners
  'morning-detox': '/images/products/22-morning-detox.jpg',
  'pineapple-express': '/images/products/23-pineapple-express.jpg',
  'citrus-blast': '/images/products/24-citrus-blast.jpg',
  'oh-sht': '/images/products/25-oh-snap.jpg',
  'kale-yea': '/images/products/26-kale-yeah.jpg',
  'lemon-drop': '/images/products/27-lemon-drop.jpg',
  'the-cure': '/images/products/28-the-cure.jpg',
  // Detox Packages
  '1-day-detox': '/images/products/04-1-day-detox-pack.jpg',
  '3-day-detox': '/images/products/05-1-day-detox-variety.jpg',
  // Subscriptions
  'wellness-shot-subscription': '/images/products/29-wellness-shot-subscription.jpg',
  'gallon-subscription': '/images/products/31-gallon-subscription.jpg',
  '3-pack-subscription': '/images/products/30-3-pack-subscription.jpg',
};

const productEmojis: Record<string, string> = {
  'kiwi-kwencher': '🥝',
  'pomegranate-pearadise': '🍐',
};

export function FeaturedProducts() {
  const { data: products, isLoading } = useFeaturedProducts();

  const getProductImage = (slug: string) => {
    return productImages[slug] || null;
  };

  const getEmoji = (slug: string) => {
    return productEmojis[slug] || '🧃';
  };

  return (
    <section className="py-24 bg-card relative">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-background to-transparent pointer-events-none" />

      <div className="container relative z-10">
        <div className="text-center mb-16">
          <span className="label-text block mb-3">Customer Favorites</span>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-brand-brown mb-3">
            Our Best Sellers
          </h2>
          <p className="font-script text-2xl text-brand-berry">
            Pressed to perfection
          </p>
        </div>

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
            {products?.map((product) => {
              const imageSrc = product.image_url || getProductImage(product.slug);
              const isSoldOut = product.stock_quantity === 0;

              return (
                <div
                  key={product.id}
                  className={cn(
                    "group bg-background rounded-3xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-lifted relative overflow-hidden flex flex-col h-full",
                    isSoldOut && "opacity-75 grayscale-[0.5] hover:opacity-100"
                  )}
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-berry to-brand-mustard transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                  <Link to={`/products/${product.slug}`} className="block mb-4 relative">
                    <div className="relative w-full aspect-[4/5] mx-auto bg-gradient-to-br from-brand-cream-dark to-brand-terracotta/20 rounded-2xl overflow-hidden flex items-center justify-center">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className={cn(
                            "w-full h-full object-cover transition-transform duration-500",
                            !isSoldOut && "group-hover:scale-110"
                          )}
                        />
                      ) : (
                        <span className="text-6xl">{getEmoji(product.slug)}</span>
                      )}

                      {/* Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 items-end z-10">
                        {isSoldOut ? (
                          <span className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                            Sold Out
                          </span>
                        ) : (
                          <>
                            {product.is_bestseller && (
                              <span className="bg-brand-mustard text-brand-brown text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                Best Seller
                              </span>
                            )}
                            {product.is_new && (
                              <span className="bg-brand-olive text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm">
                                New
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </Link>

                  <div className="flex-1 flex flex-col">
                    <Link to={`/products/${product.slug}`}>
                      <h3 className="font-display text-xl font-semibold text-brand-brown mb-1 group-hover:text-brand-berry transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-brand-warm-gray mb-4 line-clamp-2">
                      {product.ingredients || product.short_description}
                    </p>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="font-display text-lg font-medium text-brand-olive">
                        {isSoldOut ? 'Unavailable' : 'Select Size'}
                      </div>
                      <AddToCartButton
                        productId={product.id}
                        size="icon"
                        className="rounded-full bg-brand-berry hover:bg-brand-berry-dark hover:scale-110 transition-all shadow-sm disabled:opacity-50 disabled:hover:scale-100"
                        disabled={isSoldOut}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

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
