import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Leaf, ArrowRight } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex items-center justify-center bg-brand-kraft overflow-hidden">
      {/* Watercolor decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-berry/15 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-brand-mustard/20 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-brand-olive/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-brand-terracotta/15 rounded-full blur-2xl" />
      </div>

      <div className="container relative z-10 px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-olive/10 text-brand-olive border border-brand-olive/20 mb-6 animate-fade-in">
          <Leaf className="h-4 w-4" />
          <span className="text-sm font-medium">100% Organic Cold-Pressed Juices</span>
        </div>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold text-brand-brown mb-4 animate-slide-up">
          <span className="font-script text-brand-berry text-5xl md:text-7xl lg:text-8xl block mb-2">imPRESSive</span>
          Juice Bar
        </h1>

        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-slide-up">
          Fuel your body with nature's best. Our juices are made fresh every morning 
          with 100% organic ingredients, cold-pressed to preserve maximum nutrients.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
          <Button asChild size="lg" className="text-lg px-8 bg-brand-berry hover:bg-brand-berry/90 shadow-lg">
            <Link to="/products">
              Shop Juices
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="text-lg px-8 border-brand-terracotta text-brand-terracotta hover:bg-brand-terracotta hover:text-white">
            <Link to="/about">Our Story</Link>
          </Button>
        </div>

        <div className="mt-16 grid grid-cols-3 gap-8 max-w-md mx-auto animate-fade-in">
          <div className="text-center">
            <div className="text-3xl font-heading font-bold text-brand-berry">100%</div>
            <div className="text-sm text-muted-foreground">Organic</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-heading font-bold text-brand-olive">Fresh</div>
            <div className="text-sm text-muted-foreground">Daily</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-heading font-bold text-brand-mustard">Local</div>
            <div className="text-sm text-muted-foreground">Sourced</div>
          </div>
        </div>
      </div>
    </section>
  );
}
