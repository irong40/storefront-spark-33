import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/layout/Layout';
import { ArrowRight, Leaf, Droplet, Heart } from 'lucide-react';

const Index = () => {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-brand-olive/5 py-24 lg:py-32">
        <div className="container relative z-10">
          <div className="max-w-3xl">
            <h1 className="font-heading text-5xl font-bold leading-tight text-brand-brown lg:text-7xl mb-6">
              Every day we <span className="text-brand-berry">PRESS</span> to <span className="text-brand-olive">imPRESS</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 text-brand-brown/80 max-w-2xl font-light">
              Experience the difference of 100% organic, cold-pressed juices.
              Crafted daily for your wellness journey.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" className="bg-brand-berry hover:bg-brand-berry/90 text-lg px-8 h-14 rounded-full shadow-lg hover:shadow-xl transition-all">
                <Link to="/products">
                  View Our Menu <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-brand-olive text-brand-olive hover:bg-brand-olive hover:text-white h-14 rounded-full px-8">
                <Link to="/about">
                  Our Story
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background Decor */}
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-brand-mustard/20 rounded-full blur-3xl -translate-y-1/2 -z-0" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-brand-olive/10 rounded-full blur-3xl translate-y-1/4 -z-0" />
      </section>

      {/* Scrolling Announcement Banner */}
      <section className="bg-brand-berry text-white py-3 overflow-hidden">
        <div className="animate-marquee whitespace-nowrap flex">
          <span className="mx-8 text-sm font-medium">🍃 FREE Local Delivery on Orders $50+ 🍃</span>
          <span className="mx-8 text-sm font-medium">✨ New! 3-Pack Subscription - Save 15% ✨</span>
          <span className="mx-8 text-sm font-medium">🎁 eGift Cards Available - Perfect for Any Occasion 🎁</span>
          <span className="mx-8 text-sm font-medium">💚 100% Organic • Cold-Pressed • No Preservatives 💚</span>
          <span className="mx-8 text-sm font-medium">🍃 FREE Local Delivery on Orders $50+ 🍃</span>
          <span className="mx-8 text-sm font-medium">✨ New! 3-Pack Subscription - Save 15% ✨</span>
          <span className="mx-8 text-sm font-medium">🎁 eGift Cards Available - Perfect for Any Occasion 🎁</span>
          <span className="mx-8 text-sm font-medium">💚 100% Organic • Cold-Pressed • No Preservatives 💚</span>
        </div>
      </section>

      {/* Owner's Promise Section */}
      <section className="py-16 bg-brand-brown text-white">
        <div className="container text-center">
          <h2 className="font-heading text-3xl font-bold mb-12 text-brand-mustard">Owner's Promise</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <Leaf className="w-12 h-12 text-brand-olive mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">100% Cold Pressed</h3>
              <p className="text-white/70">Pure juice, extracted with hydraulic pressure to retain maximum nutrients.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <Heart className="w-12 h-12 text-brand-berry mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">No Added Sugar</h3>
              <p className="text-white/70">Sweetened only by nature. We never add artificial sweeteners.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <Droplet className="w-12 h-12 text-brand-mustard mx-auto mb-4" />
              <h3 className="font-bold text-xl mb-2">No Dilution</h3>
              <p className="text-white/70">No water added. Just raw, vibrant fruit and vegetable nectar.</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-full bg-brand-olive/20 text-brand-olive font-bold text-xl">0%</div>
              <h3 className="font-bold text-xl mb-2">No Preservatives</h3>
              <p className="text-white/70">Fresh means fresh. Consumed within days of pressing for peak potency.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="font-heading text-4xl font-bold text-brand-brown mb-4">Shop Favorites</h2>
            <p className="text-muted-foreground">Discover our most popular blends and cleanses.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Link to="/products?category=sweet-treats" className="group relative overflow-hidden rounded-3xl aspect-[4/5] bg-brand-kraft/30">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <img src="/images/categories/sweet-treats.jpg" alt="Sweet Treats" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute bottom-0 left-0 p-8 z-20 text-white">
                <h3 className="font-heading text-3xl font-bold mb-2">Sweet Treats</h3>
                <span className="text-brand-mustard font-medium flex items-center">Shop Now <ArrowRight className="ml-2 w-4 h-4" /></span>
              </div>
            </Link>

            <Link to="/products?category=energy-immunity-booster" className="group relative overflow-hidden rounded-3xl aspect-[4/5] bg-brand-kraft/30">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <img src="/images/categories/detox.jpg" alt="Energy Boosters" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute bottom-0 left-0 p-8 z-20 text-white">
                <h3 className="font-heading text-3xl font-bold mb-2">Energy & Immunity</h3>
                <span className="text-brand-mustard font-medium flex items-center">Shop Now <ArrowRight className="ml-2 w-4 h-4" /></span>
              </div>
            </Link>

            <Link to="/products?category=detox-fat-burners" className="group relative overflow-hidden rounded-3xl aspect-[4/5] bg-brand-kraft/30">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <img src="/images/categories/detox.jpg" alt="Detox & Cleanse" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute bottom-0 left-0 p-8 z-20 text-white">
                <h3 className="font-heading text-3xl font-bold mb-2">Detox & Cleanse</h3>
                <span className="text-brand-mustard font-medium flex items-center">Shop Now <ArrowRight className="ml-2 w-4 h-4" /></span>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
