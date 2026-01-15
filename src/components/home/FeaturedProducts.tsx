import { useFeaturedProducts } from '@/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from '@/contexts/CartContext';
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
  '3-pack-subscription': '/images/products/30-3-pack-subscription.jpg'
};
const productEmojis: Record<string, string> = {
  // Fallbacks
  'kiwi-kwencher': '🥝',
  'pomegranate-pearadise': '🍐'
  // ... (keep limited fallback if needed, or rely on default)
};
export function FeaturedProducts() {
  const {
    data: products,
    isLoading
  } = useFeaturedProducts();
  const {
    addItem
  } = useCart();
  const getProductImage = (slug: string) => {
    return productImages[slug] || null;
  };
  const getEmoji = (slug: string) => {
    return productEmojis[slug] || '🧃';
  };
  return <section className="py-24 bg-card relative">
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
        {isLoading ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => <div key={i} className="bg-background rounded-3xl p-6">
                <Skeleton className="w-28 h-36 mx-auto mb-4 rounded-2xl" />
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>)}
          </div> : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products?.map((product, index) => {
          const imageSrc = product.image_url || getProductImage(product.slug);
          return <div key={product.id} className="group bg-background rounded-3xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-lifted relative overflow-hidden flex flex-col h-full">
                  {/* Top gradient border on hover */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-berry to-brand-mustard transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                  {/* Image */}
                  <Link to={`/products/${product.slug}`} className="block mb-4">
                    <div className="relative w-full aspect-[4/5] mx-auto bg-gradient-to-br from-brand-cream-dark to-brand-terracotta/20 rounded-2xl overflow-hidden flex items-center justify-center">
                      {imageSrc ? <img src={imageSrc} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /> : <span className="text-6xl">{getEmoji(product.slug)}</span>}

                      {index === 0 && <span className="absolute top-3 right-3 bg-brand-berry text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                          Popular
                        </span>}
                      {index === 3 && <span className="absolute top-3 right-3 bg-brand-olive text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                          New
                        </span>}
                    </div>
                  </Link>

                  {/* Product info */}
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
                      
                      <Button size="icon" className="rounded-full bg-brand-berry hover:bg-brand-berry-dark hover:scale-110 transition-all shadow-sm" onClick={() => addItem(product.id)}>
                        <Plus className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                </div>;
        })}
          </div>}

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
    </section>;
}