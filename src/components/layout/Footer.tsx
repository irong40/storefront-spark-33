import { Link } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react';
import { useBusinessSettings } from '@/hooks/use-business';
import logo from '@/assets/logo.jpg';

export function Footer() {
  const { data: business } = useBusinessSettings();

  return (
    <footer className="bg-brand-brown text-white py-16">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center mb-4">
              <img 
                src={logo} 
                alt="imPRESSive Juice Bar" 
                className="h-16 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="font-script text-lg text-brand-mustard mb-4">
              Cold-Pressed Happiness
            </p>
            <p className="text-white/70 text-[15px] mb-6">
              {business?.description || 'Fresh, organic, cold-pressed juices crafted daily with love for your wellness journey.'}
            </p>
            {/* Social */}
            <div className="flex gap-3">
              <a 
                href={business?.social_links?.instagram || '#'} 
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all hover:bg-brand-berry hover:-translate-y-1"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href={business?.social_links?.facebook || '#'} 
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center transition-all hover:bg-brand-berry hover:-translate-y-1"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Menu Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest mb-6">Menu</h4>
            <ul className="space-y-3">
              <li><Link to="/products" className="text-white/70 hover:text-brand-berry transition-colors">All Products</Link></li>
              <li><Link to="/products?category=cold-pressed-juices" className="text-white/70 hover:text-brand-berry transition-colors">Cold-Pressed Juices</Link></li>
              <li><Link to="/products?category=wellness-shots" className="text-white/70 hover:text-brand-berry transition-colors">Wellness Shots</Link></li>
              <li><Link to="/products?category=smoothies" className="text-white/70 hover:text-brand-berry transition-colors">Smoothies</Link></li>
              <li><Link to="/products?category=detox-programs" className="text-white/70 hover:text-brand-berry transition-colors">Cleanse Programs</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest mb-6">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/about" className="text-white/70 hover:text-brand-berry transition-colors">Our Story</Link></li>
              <li><Link to="/contact" className="text-white/70 hover:text-brand-berry transition-colors">Contact Us</Link></li>
              <li><a href="#" className="text-white/70 hover:text-brand-berry transition-colors">Locations</a></li>
              <li><a href="#" className="text-white/70 hover:text-brand-berry transition-colors">Wholesale</a></li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-3">
              <li><Link to="/account" className="text-white/70 hover:text-brand-berry transition-colors">My Account</Link></li>
              <li><a href="#" className="text-white/70 hover:text-brand-berry transition-colors">Shipping Info</a></li>
              <li><a href="#" className="text-white/70 hover:text-brand-berry transition-colors">Returns</a></li>
              <li><a href="#" className="text-white/70 hover:text-brand-berry transition-colors">FAQ</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-wrap justify-between gap-4 text-sm text-white/50">
          <p>© {new Date().getFullYear()} {business?.business_name || 'imPRESSive Juice Bar'}. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
