import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export function Newsletter() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Welcome to the juice squad! Check your email for 15% off.');
    setEmail('');
    setLoading(false);
  };

  return (
    <section className="py-24 bg-gradient-to-br from-brand-berry to-brand-berry-dark text-white relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-36 -right-24 w-[500px] h-[500px] rounded-full bg-white/[0.08] blur-3xl pointer-events-none" />

      <div className="container relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-medium text-white mb-4">
              Get 15% Off Your First Order
            </h2>
            <p className="text-white/85 text-lg">
              Join our juice squad for exclusive offers, new flavor alerts, and wellness tips delivered fresh to your inbox.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 min-w-[200px] px-6 py-4 rounded-full bg-white/10 border-2 border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:border-white focus:bg-white/15 transition-all"
              required
            />
            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="rounded-full px-8 bg-white text-brand-berry hover:bg-brand-cream font-semibold transition-all hover:-translate-y-1"
            >
              {loading ? 'Subscribing...' : 'Subscribe'}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
