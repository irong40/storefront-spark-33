import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ShoppingCart, User, Settings } from 'lucide-react';
import logo from '@/assets/logo-transparent.png';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/use-admin';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Menu' },
  { href: '/about', label: 'Our Story' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const { itemCount, openCart } = useCart();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled 
        ? 'bg-background/95 backdrop-blur-xl shadow-soft' 
        : 'bg-transparent'
    }`}>
      <div className={`container flex items-center justify-between transition-all duration-300 ${
        isScrolled 
          ? 'h-16 md:h-18 lg:h-20' 
          : 'h-[88px] md:h-[112px] lg:h-[124px]'
      }`}>
        {/* Logo */}
        <Link to="/" className="flex items-center p-3">
        <img 
            src={logo} 
            alt="imPRESSive Juice Bar" 
            className={`w-auto object-contain transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_8px_20px_rgba(0,0,0,0.15)] ${
              isScrolled 
                ? 'h-10 md:h-12 lg:h-14' 
                : 'h-[70px] md:h-[90px] lg:h-[100px]'
            }`}
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="relative text-[15px] font-medium text-brand-brown py-1 group"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-berry rounded-full transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <button
            onClick={openCart}
            className="relative w-11 h-11 rounded-full bg-brand-cream-dark flex items-center justify-center transition-all hover:bg-brand-terracotta hover:text-white"
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-berry text-white text-xs font-bold flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </button>

          {/* Admin */}
          {isAdmin && (
            <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-brand-cream-dark">
              <Link to="/admin">
                <Settings className="h-5 w-5 text-brand-olive" />
              </Link>
            </Button>
          )}

          {/* User */}
          <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-brand-cream-dark hidden sm:flex">
            <Link to={user ? '/account' : '/auth'}>
              <User className="h-5 w-5 text-brand-olive" />
            </Link>
          </Button>

          {/* Order Now / Add Order CTA - Desktop */}
          {isAdmin ? (
            <Button asChild className="hidden md:inline-flex rounded-full px-6 bg-brand-olive hover:bg-brand-olive/90 shadow-sm font-semibold">
              <Link to="/admin#orders">Add Order</Link>
            </Button>
          ) : (
            <Button asChild className="hidden md:inline-flex rounded-full px-6 bg-brand-berry hover:bg-brand-berry-dark shadow-berry font-semibold">
              <Link to="/products">Order Now</Link>
            </Button>
          )}

          {/* Mobile Menu */}
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button className="flex flex-col gap-1.5 p-2">
                <span className={`block w-6 h-0.5 bg-brand-brown rounded-full transition-all ${isMobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
                <span className={`block w-6 h-0.5 bg-brand-brown rounded-full transition-all ${isMobileOpen ? 'opacity-0' : ''}`} />
                <span className={`block w-6 h-0.5 bg-brand-brown rounded-full transition-all ${isMobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full bg-background p-8 pt-24">
              <nav className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="font-display text-3xl font-medium text-brand-brown hover:text-brand-berry transition-colors pb-4 border-b border-brand-cream-dark"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to={user ? '/account' : '/auth'}
                  onClick={() => setIsMobileOpen(false)}
                  className="font-display text-3xl font-medium text-brand-brown hover:text-brand-berry transition-colors pb-4 border-b border-brand-cream-dark"
                >
                  {user ? 'My Account' : 'Sign In'}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileOpen(false)}
                    className="font-display text-3xl font-medium text-brand-brown hover:text-brand-berry transition-colors pb-4 border-b border-brand-cream-dark"
                  >
                    Admin
                  </Link>
                )}
                {isAdmin ? (
                  <Button 
                    asChild 
                    size="lg" 
                    className="mt-4 rounded-full bg-brand-olive hover:bg-brand-olive/90 shadow-sm font-semibold"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Link to="/admin#orders">Add Order</Link>
                  </Button>
                ) : (
                  <Button 
                    asChild 
                    size="lg" 
                    className="mt-4 rounded-full bg-brand-berry hover:bg-brand-berry-dark shadow-berry font-semibold"
                    onClick={() => setIsMobileOpen(false)}
                  >
                    <Link to="/products">Order Now</Link>
                  </Button>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
