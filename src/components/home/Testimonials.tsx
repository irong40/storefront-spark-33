import { Star } from 'lucide-react';

const testimonials = [
  {
    text: "Best juice bar in the area! The Green Goddess is my daily go-to. You can taste the freshness in every sip.",
    name: "Sarah M.",
    role: "Fitness Instructor",
    initials: "SM",
  },
  {
    text: "Finally, a juice bar that understands nutrition. The immunity shots got me through cold season without a single sick day!",
    name: "Michael R.",
    role: "Teacher",
    initials: "MR",
  },
  {
    text: "The 3-day cleanse was life-changing. I felt energized, lighter, and my skin was glowing. Highly recommend!",
    name: "Jennifer L.",
    role: "Busy Mom",
    initials: "JL",
  },
];

export function Testimonials() {
  return (
    <section className="py-24 bg-background">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="label-text block mb-3">What People Say</span>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-brand-brown">
            Customer Love
          </h2>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.name}
              className="bg-card rounded-3xl p-8 shadow-soft relative"
            >
              {/* Decorative quote */}
              <span className="absolute top-6 right-8 font-display text-7xl text-brand-berry/10 leading-none select-none">
                "
              </span>

              {/* Stars */}
              <div className="flex gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-brand-mustard text-brand-mustard" />
                ))}
              </div>

              {/* Text */}
              <p className="text-brand-brown italic mb-8 leading-relaxed">
                "{testimonial.text}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-terracotta to-brand-berry flex items-center justify-center text-white font-display text-lg font-semibold">
                  {testimonial.initials}
                </div>
                <div>
                  <div className="font-semibold text-brand-brown">{testimonial.name}</div>
                  <div className="text-sm text-brand-warm-gray">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
