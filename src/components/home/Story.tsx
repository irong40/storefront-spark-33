import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Leaf, Zap, Recycle } from 'lucide-react';

const features = [
  {
    icon: Leaf,
    title: 'Locally Sourced',
    description: 'Fresh produce from local farms whenever possible',
  },
  {
    icon: Zap,
    title: 'Cold-Press Technology',
    description: 'Maximum nutrients preserved in every bottle',
  },
  {
    icon: Recycle,
    title: 'Zero Waste Mission',
    description: 'Eco-friendly packaging and composting programs',
  },
];

export function Story() {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Visual - Image Grid */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-square rounded-2xl bg-brand-cream-dark flex items-center justify-center text-6xl transition-transform hover:scale-105">
                🥬
              </div>
              <div className="aspect-square rounded-2xl bg-brand-cream-dark flex items-center justify-center text-6xl translate-y-8 transition-transform hover:scale-105">
                🍊
              </div>
              <div className="aspect-square rounded-2xl bg-brand-cream-dark flex items-center justify-center text-6xl -translate-y-8 transition-transform hover:scale-105">
                🫐
              </div>
              <div className="aspect-square rounded-2xl bg-brand-cream-dark flex items-center justify-center text-6xl transition-transform hover:scale-105">
                🥕
              </div>
            </div>
          </div>

          {/* Content */}
          <div>
            <span className="label-text block mb-3">Our Story</span>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-brand-brown mb-4 leading-tight">
              Fresh From Farm{' '}
              <span className="font-script text-brand-berry text-3xl md:text-4xl">to Glass</span>
            </h2>
            <p className="text-brand-warm-gray text-lg mb-8">
              Hi, I'm Delisea Jackson, and the benefits of juicing are nothing short of imPRESSive. 
              One trip with lousy eating habits put me on this path. Now I'm here to hand you healthy 
              choices in a bottle — 100% organic, cold-pressed, and crafted with love.
            </p>

            {/* Features */}
            <div className="space-y-6 mb-8">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4 items-start">
                  <div className="w-12 h-12 bg-card rounded-xl flex items-center justify-center flex-shrink-0 shadow-soft">
                    <feature.icon className="h-6 w-6 text-brand-olive" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-brown mb-0.5">{feature.title}</h4>
                    <p className="text-sm text-brand-warm-gray">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild size="lg" className="rounded-full px-8 bg-brand-berry hover:bg-brand-berry-dark shadow-berry font-semibold">
              <Link to="/about">Learn More About Us</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
