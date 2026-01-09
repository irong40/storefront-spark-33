import { Link } from 'react-router-dom';
import { Leaf, Instagram, Facebook, MapPin, Clock, Phone } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/use-business';

export function Footer() {
  const { data: business } = useBusinessSettings();

  return (
    <footer className="bg-brand-kraft border-t border-brand-terracotta/20">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <Leaf className="h-6 w-6 text-brand-olive" />
              <span className="font-heading text-xl font-bold text-brand-brown">
                {business?.business_name || 'imPRESSive Juice Bar'}
              </span>
            </Link>
            <p className="text-muted-foreground max-w-sm mb-4">
              {business?.tagline || 'Cold-Pressed. Fresh Daily. Feel the Difference.'}
            </p>
            <div className="flex gap-4">
              <a href={business?.social_links?.instagram || '#'} className="w-10 h-10 rounded-full bg-brand-olive/10 text-brand-olive hover:bg-brand-olive hover:text-white flex items-center justify-center transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href={business?.social_links?.facebook || '#'} className="w-10 h-10 rounded-full bg-brand-olive/10 text-brand-olive hover:bg-brand-olive hover:text-white flex items-center justify-center transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="font-heading font-semibold text-brand-brown mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-muted-foreground hover:text-brand-berry transition-colors">All Products</Link></li>
              <li><Link to="/products?category=cold-pressed-juices" className="text-muted-foreground hover:text-brand-berry transition-colors">Juices</Link></li>
              <li><Link to="/products?category=wellness-shots" className="text-muted-foreground hover:text-brand-berry transition-colors">Wellness Shots</Link></li>
              <li><Link to="/products?category=detox-programs" className="text-muted-foreground hover:text-brand-berry transition-colors">Cleanses</Link></li>
            </ul>
          </div>

          {/* Local Store Info */}
          <div>
            <h3 className="font-heading font-semibold text-brand-brown mb-4">Find Us Locally</h3>
            <div className="space-y-3 text-muted-foreground text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-brand-olive shrink-0" />
                <span>
                  Bloom Market<br />
                  719 High St.<br />
                  Portsmouth, VA 23703
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-brand-olive shrink-0" />
                <span>
                  Tue - Fri: 10am - 6pm<br />
                  Sat: 10am - 4pm
                </span>
              </div>
              {business?.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-brand-olive shrink-0" />
                  <span>{business.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-brand-terracotta/20 mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {business?.business_name || 'imPRESSive Juice Bar'}. Made with 🌱 and love.</p>
        </div>
      </div>
    </footer>
  );
}
