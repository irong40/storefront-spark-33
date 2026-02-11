import { Star } from "lucide-react";

const testimonials = [
  {
    text: "10/10 recommend imPRESSive Juice Bar. I absolutely love their juices. It's so hard to pick a favorite!",
    name: "Deidra",
    role: "Loyal Customer",
    initials: "D",
  },
  {
    text: "So glad I found imPRESSive Juice Bar. The juices were fresh, delicious and the 3 day detox was definitely Effective!",
    name: "Sharyn",
    role: "Detox Enthusiast",
    initials: "S",
  },
  {
    text: "These juices bless every time! My favorite juice is the Pomegranate PEARadise! Always fresh tasting and I love they don't add anything extra.",
    name: "Janelle",
    role: "Regular Customer",
    initials: "J",
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
                  <Star
                    key={i}
                    className="h-5 w-5 fill-brand-mustard text-brand-mustard"
                  />
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
                  <div className="font-semibold text-brand-brown">
                    {testimonial.name}
                  </div>
                  <div className="text-sm text-brand-warm-gray">
                    {testimonial.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
