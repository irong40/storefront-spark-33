import { useCategories } from '@/hooks/use-categories';
import { Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Droplets, Zap, Sparkles, Calendar } from 'lucide-react';

const categoryIcons: Record<string, React.ReactNode> = {
  'cold-pressed-juices': <Droplets className="h-8 w-8" />,
  'wellness-shots': <Zap className="h-8 w-8" />,
  'detox-programs': <Sparkles className="h-8 w-8" />,
  'subscriptions': <Calendar className="h-8 w-8" />,
};

export function Categories() {
  const { data: categories, isLoading } = useCategories();

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
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
                className="group relative bg-card rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-border hover:border-primary/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    {categoryIcons[category.slug] || <Droplets className="h-8 w-8" />}
                  </div>
                  
                  <h3 className="text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
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
