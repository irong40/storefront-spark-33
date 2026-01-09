import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function CTA() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
          Ready to Feel Amazing?
        </h2>
        <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
          Join thousands of happy customers who have made fresh juice a part of their daily wellness routine.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" variant="secondary" className="text-lg px-8">
            <Link to="/products">
              Start Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button 
            asChild 
            size="lg" 
            variant="outline" 
            className="text-lg px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Link to="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
