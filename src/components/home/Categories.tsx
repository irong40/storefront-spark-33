import { useCategories } from '@/hooks/use-categories';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Cherry, Zap, Flame, RefreshCw, Gift, Package } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  'sweet-treats': <Cherry className="h-8 w-8" />,
  'energy-immunity-boosters': <Zap className="h-8 w-8" />,
  'detox-fat-burners': <Flame className="h-8 w-8" />,
  'subscriptions': <RefreshCw className="h-8 w-8" />,
  'gift-cards': <Gift className="h-8 w-8" />,
  'sample-boxes': <Package className="h-8 w-8" />,
};

export function Categories() {
  const { data: categories, isLoading } = useCategories();

  return (
    <section className="py-20 bg-brand-kraft/50">
      <div className="container px-4">
        <div className="text-center mb-12">
          <span className="font-script text-2xl text-brand-terracotta mb-2 block">Explore</span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-brand-brown mb-4">
            Shop by Category
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From daily juices to comprehensive cleanse programs, find what's right for you
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories?.map((category) => (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="group relative bg-card rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border-2 border-brand-terracotta/10 hover:border-brand-berry/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-berry/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-brand-olive/10 text-brand-olive flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-brand-berry group-hover:text-white transition-all">
                    {categoryIcons[category.slug] || <Package className="h-8 w-8" />}
                  </div>

                  <h3 className="text-xl font-heading font-semibold text-brand-brown mb-2 group-hover:text-brand-berry transition-colors">
                    {category.name}
                  </h3>

                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {category.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
