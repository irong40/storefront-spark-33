import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTA() {
  return (
    <section className="py-20 bg-brand-berry text-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-mustard/20 rounded-full blur-3xl" />
      </div>

      <div className="container px-4 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
          Ready to Feel <span className="font-script">Amazing?</span>
        </h2>
        <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
          Join thousands of happy customers who have made fresh juice a part of
          their daily wellness routine.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="text-lg px-8 bg-white text-brand-berry hover:bg-brand-cream"
          >
            <Link to="/products">
              Start Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="text-lg px-8 border-white/40 text-white hover:bg-white/10 hover:border-white"
          >
            <Link to="/contact">Contact Us</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
