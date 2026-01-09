import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Heart, Leaf, Users } from 'lucide-react';
import brandLogo from '@/assets/brand-logo.png';

export function Story() {
  return (
    <section className="py-20 bg-card">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="font-script text-2xl text-brand-terracotta mb-2 block">Our Story</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-brand-brown mb-6">
              Crafted with Love, <br />Pressed with Purpose
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              Hi, I'm Delisea Jackson, and the benefits of juicing are nothing short of imPRESSive. 
              One trip with lousy eating habits put me on this path. Now I'm here to hand you healthy 
              choices in a bottle.
            </p>
            <p className="text-muted-foreground text-lg mb-8">
              We at imPRESSive Juice Bar exist to provide quality organic cold-pressed juice 
              while delivering an easy way to make a healthy choice. Every bottle is crafted 
              with 100% organic ingredients, sourced locally whenever possible.
            </p>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-olive/10 text-brand-olive flex items-center justify-center mx-auto mb-2">
                  <Leaf className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium text-brand-brown">100% Organic</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-berry/10 text-brand-berry flex items-center justify-center mx-auto mb-2">
                  <Heart className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium text-brand-brown">Made Fresh</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-brand-mustard/10 text-brand-mustard flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium text-brand-brown">Community First</div>
              </div>
            </div>

            <Button asChild className="bg-brand-berry hover:bg-brand-berry/90">
              <Link to="/about">Learn More About Us</Link>
            </Button>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl bg-brand-kraft border-2 border-brand-terracotta/20 shadow-lg overflow-hidden flex items-center justify-center p-6">
              <img 
                src={brandLogo} 
                alt="imPRESSive Juice Bar" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-brand-berry/15 rounded-full blur-2xl" />
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-brand-mustard/15 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
