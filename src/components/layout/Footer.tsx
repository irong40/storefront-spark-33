import { Link } from 'react-router-dom';
import { Leaf, Instagram, Facebook } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/use-business';

export function Footer() {
  const { data: business } = useBusinessSettings();

  return (
    <footer className="bg-secondary border-t">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-heading text-xl font-bold text-primary mb-4">
              <Leaf className="h-6 w-6" />
              <span>{business?.business_name || 'imPRESSive Juice Bar'}</span>
            </Link>
            <p className="text-muted-foreground max-w-sm">
              {business?.tagline || 'Cold-Pressed. Fresh Daily. Feel the Difference.'}
            </p>
            <div className="flex gap-4 mt-4">
              <a href={business?.social_links?.instagram || '#'} className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href={business?.social_links?.facebook || '#'} className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-heading font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-muted-foreground hover:text-primary transition-colors">All Products</Link></li>
              <li><Link to="/products?category=cold-pressed-juices" className="text-muted-foreground hover:text-primary transition-colors">Juices</Link></li>
              <li><Link to="/products?category=wellness-shots" className="text-muted-foreground hover:text-primary transition-colors">Wellness Shots</Link></li>
              <li><Link to="/products?category=detox-programs" className="text-muted-foreground hover:text-primary transition-colors">Cleanses</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-muted-foreground">
              {business?.email && <li>{business.email}</li>}
              {business?.phone && <li>{business.phone}</li>}
              {business?.address_line1 && (
                <li>
                  {business.address_line1}<br />
                  {business.city}, {business.state} {business.zip}
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} {business?.business_name || 'imPRESSive Juice Bar'}. Made with 🌱 and love.</p>
        </div>
      </div>
    </footer>
  );
}
