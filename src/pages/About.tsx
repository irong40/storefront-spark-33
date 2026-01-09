import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Leaf, Heart, Users, Droplets, Recycle, Award } from 'lucide-react';

const values = [
  {
    icon: Leaf,
    title: '100% Organic',
    description: 'We source only certified organic produce, ensuring every sip is free from pesticides and harmful chemicals.',
  },
  {
    icon: Droplets,
    title: 'Cold-Pressed',
    description: 'Our hydraulic press extracts juice without heat, preserving vital enzymes and nutrients.',
  },
  {
    icon: Heart,
    title: 'Made Fresh Daily',
    description: 'Every juice is pressed fresh each morning. No preservatives, no pasteurization, just pure goodness.',
  },
  {
    icon: Users,
    title: 'Community First',
    description: 'We partner with local farmers and give back to wellness programs in our community.',
  },
  {
    icon: Recycle,
    title: 'Eco-Friendly',
    description: 'Our bottles are 100% recyclable and we offer a bottle return program for discounts.',
  },
  {
    icon: Award,
    title: 'Quality Guaranteed',
    description: 'Not satisfied? We\'ll make it right. Your wellness journey is our priority.',
  },
];

export default function About() {
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary to-accent/10 py-20">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <span className="text-primary font-medium mb-4 block">Our Story</span>
            <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-6">
              Crafted with Love, Pressed with Purpose
            </h1>
            <p className="text-muted-foreground text-lg">
              From a small kitchen to your community's favorite juice bar, 
              here's how imPRESSive came to be.
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <h2 className="text-3xl font-display font-bold text-foreground mb-6">
                It Started with a Simple Question
              </h2>
              <div className="space-y-4 text-muted-foreground">
                <p>
                  "Why is it so hard to find truly fresh, healthy juice?" That question led 
                  our founder on a journey that would eventually become imPRESSive Juice Bar.
                </p>
                <p>
                  After years of struggling with energy levels and digestive issues, discovering 
                  the power of fresh, cold-pressed juice was life-changing. But finding high-quality 
                  juice locally was nearly impossible.
                </p>
                <p>
                  So in 2020, armed with a single cold-press machine and a passion for wellness, 
                  imPRESSive was born in a tiny kitchen. What started as juices for friends and 
                  family quickly grew into a beloved community staple.
                </p>
                <p>
                  Today, we press hundreds of bottles daily, but our commitment remains the same: 
                  fresh, organic, delicious juice that makes you feel amazing.
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/20 via-secondary to-accent/20 flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="text-7xl mb-6">🍃</div>
                  <p className="text-2xl font-display font-bold text-foreground">
                    Est. 2020
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-secondary/30">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-display font-bold text-foreground mb-6">
              Our Mission
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              To make healthy living delicious and accessible. We believe everyone deserves 
              access to nutrient-rich, fresh-pressed juice that tastes as good as it makes you feel.
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary/10 text-primary">
              <Leaf className="h-5 w-5" />
              <span className="font-medium">"Feel the Difference"</span>
            </div>
          </div>
        </div>
      </section>

      {/* Values Grid */}
      <section className="py-20">
        <div className="container px-4">
          <h2 className="text-3xl font-display font-bold text-foreground text-center mb-12">
            What We Stand For
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {value.title}
                </h3>
                <p className="text-muted-foreground">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cold Press Process */}
      <section className="py-20 bg-secondary/30">
        <div className="container px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-display font-bold text-foreground text-center mb-12">
              The Cold-Press Difference
            </h2>
            <div className="space-y-8">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Source the Best</h3>
                  <p className="text-muted-foreground">
                    We work with local organic farms to source the freshest, highest-quality produce available.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Wash & Prep</h3>
                  <p className="text-muted-foreground">
                    Every ingredient is thoroughly washed and carefully prepared by our trained team.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Cold Press</h3>
                  <p className="text-muted-foreground">
                    Our hydraulic press applies thousands of pounds of pressure without heat, 
                    extracting maximum nutrients while preserving delicate enzymes.
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Bottle Fresh</h3>
                  <p className="text-muted-foreground">
                    Immediately bottled and refrigerated, our juices reach you at peak freshness. 
                    Best enjoyed within 3-5 days.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container px-4 text-center">
          <h2 className="text-3xl font-display font-bold mb-4">
            Ready to Taste the Difference?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-8">
            Join thousands of customers who have made fresh juice a daily ritual.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link to="/products">Shop Our Juices</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
}
