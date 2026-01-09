import { MapPin, Clock, Phone } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/use-business';

export function Locations() {
  const { data: business } = useBusinessSettings();

  return (
    <section className="py-24 bg-card">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="label-text block mb-3">Visit Us</span>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-brand-brown">
            Find Us Locally
          </h2>
        </div>

        {/* Location Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Main Location */}
          <div className="bg-background rounded-3xl overflow-hidden transition-all hover:shadow-lifted hover:-translate-y-1">
            {/* Map placeholder */}
            <div className="h-48 bg-gradient-to-br from-brand-olive-light to-brand-olive flex items-center justify-center">
              <MapPin className="h-16 w-16 text-white/30" />
            </div>
            
            {/* Content */}
            <div className="p-6">
              <h3 className="font-display text-2xl font-semibold text-brand-brown mb-4">
                Bloom Market
              </h3>
              <div className="space-y-3 text-brand-warm-gray">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-brand-olive mt-0.5 flex-shrink-0" />
                  <span>
                    719 High St.<br />
                    Portsmouth, VA 23703
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-brand-olive mt-0.5 flex-shrink-0" />
                  <span>
                    Tue - Fri: 10am - 6pm<br />
                    Sat: 10am - 4pm
                  </span>
                </div>
                {business?.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-brand-olive flex-shrink-0" />
                    <a href={`tel:${business.phone}`} className="hover:text-brand-berry transition-colors">
                      {business.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Coming Soon */}
          <div className="bg-background rounded-3xl overflow-hidden transition-all hover:shadow-lifted hover:-translate-y-1">
            {/* Map placeholder */}
            <div className="h-48 bg-gradient-to-br from-brand-terracotta-light to-brand-terracotta flex items-center justify-center">
              <span className="text-6xl">🎉</span>
            </div>
            
            {/* Content */}
            <div className="p-6">
              <h3 className="font-display text-2xl font-semibold text-brand-brown mb-4">
                More Locations Coming Soon
              </h3>
              <p className="text-brand-warm-gray">
                We're expanding! Subscribe to our newsletter to be the first to know when we open new locations in your area.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
