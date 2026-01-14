import { Leaf, Sun, Heart, Recycle, Sparkles } from 'lucide-react';

const benefits = [
  { icon: Leaf, text: 'All Natural' },
  { icon: Sun, text: 'Pressed Fresh Daily' },
  { icon: Heart, text: 'Made with Love' },
  { icon: Recycle, text: 'Eco-Friendly Packaging' },
  { icon: Sparkles, text: 'No Preservatives' },
];

export function BenefitsBar() {
  return (
    <section className="bg-brand-olive py-4 overflow-hidden">
      <div className="animate-scroll flex gap-16">
        {/* Duplicate for seamless loop */}
        {[...benefits, ...benefits].map((benefit, index) => (
          <div key={index} className="flex items-center gap-3 text-white whitespace-nowrap flex-shrink-0">
            <benefit.icon className="h-5 w-5 opacity-80" />
            <span className="text-sm font-medium tracking-wide">{benefit.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
