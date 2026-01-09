import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ShoppingCart, User, Leaf, Settings } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/use-admin';
import { useState, useEffect } from 'react';

const navLinks = [
  { href: '/products', label: 'Products' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function Header() {
  const { itemCount, openCart } = useCart();
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${
      isScrolled ? 'bg-brand-kraft/95 backdrop-blur supports-[backdrop-filter]:bg-brand-kraft/80 shadow-sm border-b border-brand-terracotta/10' : 'bg-transparent'
    }`}>
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Leaf className="h-6 w-6 text-brand-olive" />
          <span className="font-heading text-xl font-bold text-brand-brown">
            im<span className="text-brand-berry">PRESS</span>ive
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-brand-berry transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="relative text-brand-olive hover:text-brand-berry hover:bg-brand-olive/10" 
            onClick={openCart}
          >
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-brand-berry text-white text-xs flex items-center justify-center">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </Button>

          {isAdmin && (
            <Button variant="ghost" size="icon" asChild className="text-brand-olive hover:text-brand-berry hover:bg-brand-olive/10">
              <Link to="/admin">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          )}

          <Button variant="ghost" size="icon" asChild className="text-brand-olive hover:text-brand-berry hover:bg-brand-olive/10">
            <Link to={user ? '/account' : '/auth'}>
              <User className="h-5 w-5" />
            </Link>
          </Button>

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="text-brand-olive hover:text-brand-berry hover:bg-brand-olive/10">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] bg-brand-kraft">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-lg font-medium text-brand-brown hover:text-brand-berry transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  to={user ? '/account' : '/auth'}
                  className="text-lg font-medium text-brand-brown hover:text-brand-berry transition-colors"
                >
                  {user ? 'My Account' : 'Sign In'}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-lg font-medium text-brand-brown hover:text-brand-berry transition-colors"
                  >
                    Admin
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
