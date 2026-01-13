import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { MapPin, Clock } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/use-business';
import { formatHoursLines } from '@/lib/format-hours';

// Import value illustrations
import valueOrganic from '@/assets/value-organic.png';
import valueColdpressed from '@/assets/value-coldpressed.png';
import valueFresh from '@/assets/value-fresh.png';
import valueCommunity from '@/assets/value-community.png';
import valueEco from '@/assets/value-eco.png';
import valueQuality from '@/assets/value-quality.png';

const values = [
  {
    image: valueOrganic,
    title: '100% Organic',
    description: 'Certified organic ingredients, sourced responsibly for purity and taste.',
  },
  {
    image: valueColdpressed,
    title: 'Cold-Pressed',
    description: 'Nutrient-rich extraction using hydraulic pressure, preserving vitamins and enzymes.',
  },
  {
    image: valueFresh,
    title: 'Made Fresh Daily',
    description: 'Small batches crafted every morning to ensure peak freshness and flavor.',
  },
  {
    image: valueCommunity,
    title: 'Community First',
    description: 'Committed to supporting local farms, partners, and fostering a healthy community.',
  },
  {
    image: valueEco,
    title: 'Eco-Friendly',
    description: 'Sustainable practices, from recyclable packaging to waste reduction initiatives.',
  },
  {
    image: valueQuality,
    title: 'Quality Guaranteed',
    description: 'Uncompromising standards, ensuring every bottle meets our rigorous quality criteria.',
  },
];

export default function About() {
  const { data: business } = useBusinessSettings();
  return (
    <Layout>
      {/* Hero Section - Kraft Paper Style */}
      <section className="relative pt-8 pb-20 overflow-hidden bg-brand-kraft">
        {/* Watercolor decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-berry/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-mustard/20 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-brand-olive/15 rounded-full blur-2xl" />
        </div>

        <div className="container px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="font-script text-3xl text-brand-berry mb-2 block">Our Story</span>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-brand-brown mb-6">
              Crafted with Love, Pressed with Purpose
            </h1>
            <p className="text-muted-foreground text-lg">
              From a trip to NYC to your community's favorite juice bar — 
              here's how imPRESSive came to be.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Story Section */}
      <section className="py-20 bg-card">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <span className="font-script text-2xl text-brand-terracotta mb-2 block">Meet the Founder</span>
              <h2 className="text-3xl font-heading font-bold text-brand-brown mb-6">
                Hi, I'm Delisea Jackson
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p className="text-lg font-medium text-brand-olive">
                  And the benefits of juicing are nothing short of imPRESSive.
                </p>
                <p>
                  One trip with lousy eating habits put me on this path. Now I'm here to hand you healthy choices in a bottle.
                </p>
                <p>
                  Eating on the run every day can be terrible for your body, even worse when you take a trip out of town. No stove and those tiny refrigerators are a recipe for disaster. I was in New York City on a work trip, which is the Mecca of eating on the run.
                </p>
                <p>
                  With my eating habits at an all-time low, my stomach declared its disappointment with me loud and clear. I was extremely bloated and feeling blah, so eventually, I came to my good senses and decided to stop pushing down junk food and try a juice cleanse.
                </p>
                <p>
                  I'd heard of juice cleanses and had never tried one, but I knew I'd have to try something since I hit rock bottom. Desperation turned to curiosity which led to tons of research about the health benefits of various vegetables, fruits, herbs, and spices.
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative">
                <div className="aspect-[4/3] rounded-3xl bg-brand-kraft border-4 border-brand-terracotta/30 shadow-xl overflow-hidden">
                  <img 
                    src="/images/about-founder.png" 
                    alt="Delisea Jackson, founder of imPRESSive Juice Bar" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-brand-berry/20 rounded-full blur-xl" />
                <div className="absolute -top-4 -left-4 w-20 h-20 bg-brand-mustard/20 rounded-full blur-xl" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Journey Continues */}
      <section className="py-20 bg-brand-kraft/50">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-brand-brown text-center mb-8">
              <span className="font-script text-brand-berry">My Quest to</span>{' '}
              imPRESS
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                I then performed a three-day nine-juice detox. I even recruited a few friends to join in, and after the third day, our bodies felt terrific! I'd bragged so much about how good I felt that other friends asked me to make juices for their detox.
              </p>
              <p>
                We at imPRESSive Juice Bar exist to provide quality organic cold-pressed juice while delivering an easy way to make a healthy choice. It brings us great joy to see customers pleased with imPRESSive's fresh taste and the detoxifying effect provided by the replenishing nutrients we place in every bottle.
              </p>
              <p className="text-lg font-medium text-brand-olive italic border-l-4 border-brand-berry pl-6">
                "We leave no stone unturned, ensuring an imPRESSive taste from the first sip to the last."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Local Availability Card */}
      <section className="py-20 bg-card">
        <div className="container px-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-brand-kraft rounded-3xl p-8 md:p-12 border-2 border-brand-terracotta/30 shadow-lg relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-berry/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-mustard/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <h3 className="font-script text-3xl text-brand-berry mb-2 text-center">
                  Want your juices while on the go?
                </h3>
                <p className="text-center text-muted-foreground mb-8">
                  Our juices are also available locally!
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-olive/20 text-brand-olive flex items-center justify-center shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-brand-brown">Bloom Market</h4>
                      <p className="text-muted-foreground text-sm">
                        {business?.address_line1 || '719 High St.'}<br />
                        {business?.city || 'Portsmouth'}, {business?.state || 'VA'} {business?.zip || '23703'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-olive/20 text-brand-olive flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-brand-brown">Hours of Operation</h4>
                      <p className="text-muted-foreground text-sm">
                        {formatHoursLines(business?.hours as Record<string, string> | null).map((line, i) => (
                          <span key={i}>
                            {line}
                            {i < formatHoursLines(business?.hours as Record<string, string> | null).length - 1 && <br />}
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20 bg-brand-cream">
        <div className="container px-4">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-brand-brown text-center mb-4">
            What We Stand For
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Every bottle of imPRESSive juice is crafted with intention and care.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <div 
                key={index} 
                className="bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-medium transition-all duration-300 hover:-translate-y-1 group"
              >
                {/* Illustration */}
                <div className="w-full aspect-[4/3] overflow-hidden bg-brand-cream/50">
                  <img 
                    src={value.image} 
                    alt={value.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                {/* Text content */}
                <div className="p-5">
                  <h3 className="text-xl font-heading font-semibold text-brand-terracotta mb-2 text-center">
                    {value.title}
                  </h3>
                  <p className="text-muted-foreground text-sm text-center leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cold Press Process */}
      <section className="py-20 bg-brand-kraft/50">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-heading font-bold text-brand-brown text-center mb-12">
              <span className="font-script text-brand-terracotta">The</span> Cold-Press Difference
            </h2>
            <div className="space-y-8">
              {[
                { step: 1, title: 'Source the Best', desc: 'We work with local organic farms to source the freshest, highest-quality produce available.' },
                { step: 2, title: 'Wash & Prep', desc: 'Every ingredient is thoroughly washed and carefully prepared by our trained team.' },
                { step: 3, title: 'Cold Press', desc: 'Our hydraulic press applies thousands of pounds of pressure without heat, extracting maximum nutrients while preserving delicate enzymes.' },
                { step: 4, title: 'Bottle Fresh', desc: 'Immediately bottled and refrigerated, our juices reach you at peak freshness. Best enjoyed within 3-5 days.' },
              ].map((item) => (
                <div key={item.step} className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-brand-berry text-white flex items-center justify-center shrink-0 font-heading font-bold shadow-lg">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-brand-brown mb-2">{item.title}</h3>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-brand-berry text-white">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-heading font-bold mb-4">
            Ready to Taste the Difference?
          </h2>
          <p className="text-white/80 text-lg max-w-2xl mx-auto mb-8">
            Join thousands of customers who have made fresh juice a daily ritual.
          </p>
          <Button asChild size="lg" className="bg-white text-brand-berry hover:bg-brand-cream">
            <Link to="/products">Shop Our Juices</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
