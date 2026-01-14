import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useFeaturedProducts } from '@/hooks/use-products';
import { Skeleton } from '@/components/ui/skeleton';

export function Hero() {
  const { data: products, isLoading } = useFeaturedProducts();
  const displayProducts = products?.slice(0, 3) || [];

  return (
    <section className="relative min-h-screen flex items-center pt-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-brand-cream-dark to-brand-kraft" />

      {/* Decorative circles */}
      <div className="absolute -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-radial from-brand-berry/[0.08] to-transparent pointer-events-none" />
      <div className="absolute -bottom-[30%] -left-[10%] w-[600px] h-[600px] rounded-full bg-gradient-radial from-brand-olive/[0.08] to-transparent pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Content */}
          <div className="max-w-xl animate-fade-in-up">
            {/* Tagline */}
            <div className="flex items-center gap-4 mb-6">
              <span className="w-10 h-0.5 bg-brand-berry rounded-full" />
              <span className="font-script text-xl md:text-2xl text-brand-berry">
                Cold-Pressed Happiness
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-medium text-brand-brown mb-6 leading-tight">
              Nourish Your Body,{' '}
              <span className="relative inline-block text-brand-olive">
                Elevate Your Day
                <span className="absolute bottom-1 left-0 right-0 h-3 bg-brand-mustard/40 -z-10 rounded-full" />
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg text-brand-warm-gray mb-8 max-w-md">
              Fresh, cold-pressed juices crafted daily with love. No additives, no preservatives — just pure, vibrant nutrition in every sip.
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 mb-12">
              <Button asChild size="lg" className="rounded-full px-8 bg-brand-berry hover:bg-brand-berry-dark shadow-berry text-base font-semibold tracking-wide transition-all hover:-translate-y-1 hover:shadow-lg">
                <Link to="/products">
                  Explore Menu
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="rounded-full px-8 border-2 border-brand-olive text-brand-olive hover:bg-brand-olive hover:text-white text-base font-semibold tracking-wide transition-all hover:-translate-y-1">
                <Link to="/about">Our Story</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-12">
              <div className="text-center">
                <div className="font-display text-3xl md:text-4xl font-semibold text-brand-brown">100%</div>
                <div className="text-sm text-brand-warm-gray mt-1">Fresh Produce</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl md:text-4xl font-semibold text-brand-brown">24</div>
                <div className="text-sm text-brand-warm-gray mt-1">Unique Blends</div>
              </div>
              <div className="text-center">
                <div className="font-display text-3xl md:text-4xl font-semibold text-brand-brown">5K+</div>
                <div className="text-sm text-brand-warm-gray mt-1">Happy Customers</div>
              </div>
            </div>
          </div>

          {/* Visual */}
          <div className="relative flex items-center justify-center">
            <div className="relative w-full max-w-lg aspect-square">
              {/* Background circle */}
              <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-brand-cream-dark to-brand-terracotta opacity-30" />

              {/* Floating juice cards - Dynamic from database */}
              {isLoading ? (
                <>
                  <Skeleton className="absolute top-[10%] left-[5%] w-44 h-56 rounded-2xl" />
                  <Skeleton className="absolute top-[45%] right-0 w-44 h-56 rounded-2xl" />
                  <Skeleton className="absolute bottom-[5%] left-[15%] w-44 h-56 rounded-2xl" />
                </>
              ) : (
                <>
                  {displayProducts[0] && (
                    <Link
                      to={`/products/${displayProducts[0].slug}`}
                      className="absolute top-[10%] left-[5%] bg-card rounded-2xl p-3 shadow-lifted animate-float z-10 w-44 hover:shadow-xl transition-shadow"
                    >
                      <div className="aspect-[4/5] rounded-xl overflow-hidden mb-3">
                        <img
                          src={displayProducts[0].image_url || '/placeholder.svg'}
                          alt={displayProducts[0].name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="font-display text-sm font-semibold text-brand-brown truncate">
                        {displayProducts[0].name}
                      </div>
                      <div className="text-xs text-brand-warm-gray line-clamp-1">
                        {displayProducts[0].short_description || displayProducts[0].ingredients || 'Fresh & Natural'}
                      </div>
                    </Link>
                  )}

                  {displayProducts[1] && (
                    <Link
                      to={`/products/${displayProducts[1].slug}`}
                      className="absolute top-[45%] right-0 bg-card rounded-2xl p-3 shadow-lifted animate-float-delayed z-20 w-44 hover:shadow-xl transition-shadow"
                    >
                      <div className="aspect-[4/5] rounded-xl overflow-hidden mb-3">
                        <img
                          src={displayProducts[1].image_url || '/placeholder.svg'}
                          alt={displayProducts[1].name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="font-display text-sm font-semibold text-brand-brown truncate">
                        {displayProducts[1].name}
                      </div>
                      <div className="text-xs text-brand-warm-gray line-clamp-1">
                        {displayProducts[1].short_description || displayProducts[1].ingredients || 'Fresh & Natural'}
                      </div>
                    </Link>
                  )}

                  {displayProducts[2] && (
                    <Link
                      to={`/products/${displayProducts[2].slug}`}
                      className="absolute bottom-[5%] left-[15%] bg-card rounded-2xl p-3 shadow-lifted animate-float-slow z-30 w-44 hover:shadow-xl transition-shadow"
                    >
                      <div className="aspect-[4/5] rounded-xl overflow-hidden mb-3">
                        <img
                          src={displayProducts[2].image_url || '/placeholder.svg'}
                          alt={displayProducts[2].name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="font-display text-sm font-semibold text-brand-brown truncate">
                        {displayProducts[2].name}
                      </div>
                      <div className="text-xs text-brand-warm-gray line-clamp-1">
                        {displayProducts[2].short_description || displayProducts[2].ingredients || 'Fresh & Natural'}
                      </div>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
