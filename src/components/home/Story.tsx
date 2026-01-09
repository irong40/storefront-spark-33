import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Heart, Leaf, Users } from 'lucide-react';

export function Story() {
  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-primary font-medium mb-4 block">Our Story</span>
            <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">
              Crafted with Love, <br />Pressed with Purpose
            </h2>
            <p className="text-muted-foreground text-lg mb-6">
              imPRESSive Juice Bar was born from a simple belief: everyone deserves access 
              to fresh, nutrient-rich juices that taste amazing. We started in a small 
              kitchen with a single cold-press machine and a passion for wellness.
            </p>
            <p className="text-muted-foreground text-lg mb-8">
              Today, we're proud to serve our community with the same dedication to 
              quality and freshness. Every juice is made with 100% organic ingredients, 
              sourced locally whenever possible.
            </p>

            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <Leaf className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium">100% Organic</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <Heart className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium">Made Fresh</div>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-2">
                  <Users className="h-6 w-6" />
                </div>
                <div className="text-sm font-medium">Community First</div>
              </div>
            </div>

            <Button asChild>
              <Link to="/about">Learn More About Us</Link>
            </Button>
          </div>

          <div className="relative">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-secondary to-accent/20 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">🍃</div>
                <p className="text-2xl font-display font-bold text-foreground">
                  "Feel the Difference"
                </p>
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
