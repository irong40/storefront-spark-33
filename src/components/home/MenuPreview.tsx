import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const categories = ['All', 'Juices', 'Shots', 'Smoothies', 'Bowls'];

const menuItems = [
  { emoji: '🥬', name: 'Green Goddess', desc: 'Kale, Spinach, Apple, Cucumber', price: 9.5, cal: 120 },
  { emoji: '🥕', name: 'Golden Hour', desc: 'Carrot, Orange, Turmeric, Ginger', price: 8.5, cal: 145 },
  { emoji: '🍊', name: 'Citrus Sunrise', desc: 'Orange, Grapefruit, Lemon, Ginger', price: 8, cal: 110 },
  { emoji: '🫐', name: 'Berry Bliss', desc: 'Blueberry, Acai, Banana, Almond Milk', price: 10, cal: 180 },
  { emoji: '🧡', name: 'Immunity Shot', desc: 'Ginger, Turmeric, Cayenne, Lemon', price: 4, cal: 15 },
  { emoji: '🥭', name: 'Tropical Thunder', desc: 'Mango, Pineapple, Coconut, Lime', price: 9, cal: 160 },
];

export function MenuPreview() {
  return (
    <section className="py-24 bg-gradient-to-br from-brand-olive to-brand-olive-dark text-white relative overflow-hidden">
      {/* Decorative circle */}
      <div className="absolute -top-[50%] -right-[20%] w-[600px] h-[600px] rounded-full bg-white/5 pointer-events-none" />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-brand-mustard text-xs font-semibold uppercase tracking-[3px] block mb-3">
            What We Offer
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-white mb-3">
            Explore Our Menu
          </h2>
          <p className="font-script text-xl text-brand-cream/90">
            Crafted for your wellness journey
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category, index) => (
            <button
              key={category}
              className={`px-6 py-2.5 rounded-full text-sm font-medium border transition-all ${
                index === 0
                  ? 'bg-white text-brand-olive border-white'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white hover:text-brand-olive hover:border-white'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menuItems.map((item) => (
            <div
              key={item.name}
              className="group bg-white/[0.08] border border-white/10 rounded-2xl p-5 flex gap-4 transition-all hover:bg-white/[0.12] hover:-translate-y-1"
            >
              {/* Image */}
              <div className="w-20 h-20 bg-white/10 rounded-xl flex items-center justify-center text-4xl flex-shrink-0">
                {item.emoji}
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-display text-lg font-semibold text-white mb-1">
                  {item.name}
                </h3>
                <p className="text-sm text-white/70 mb-2 line-clamp-1">
                  {item.desc}
                </p>
                <div className="flex items-center justify-between">
                  <span className="font-display text-xl font-semibold text-brand-mustard">
                    ${item.price.toFixed(2)}
                  </span>
                  <span className="text-xs text-white/50">
                    {item.cal} cal
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Button asChild size="lg" className="rounded-full px-8 bg-white text-brand-olive hover:bg-brand-cream shadow-medium font-semibold transition-all hover:-translate-y-1">
            <Link to="/products">
              View Full Menu
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
