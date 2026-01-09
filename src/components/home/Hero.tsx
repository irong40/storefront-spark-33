import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Leaf, ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary to-accent/10 overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative z-10 px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6 animate-fade-in">
          <Leaf className="h-4 w-4" />
          <span className="text-sm font-medium">100% Organic Ingredients</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-foreground mb-6 animate-slide-up">
          Cold-Pressed.{' '}
          <span className="text-primary">Fresh Daily.</span>
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up">
          Fuel your body with nature's best. Our juices are made fresh every morning 
          with 100% organic ingredients, cold-pressed to preserve maximum nutrients.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/products">
              Shop Juices
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8">
            <Link to="/about">Our Story</Link>
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto animate-fade-in">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">100%</div>
            <div className="text-sm text-muted-foreground">Organic</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">Fresh</div>
            <div className="text-sm text-muted-foreground">Daily</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">Local</div>
            <div className="text-sm text-muted-foreground">Sourced</div>
          </div>
        </div>
      </div>
    </section>
  );
}
