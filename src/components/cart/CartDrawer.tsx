import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { CartItem } from './CartItem';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

export function CartDrawer() {
  const { items, subtotal, isOpen, closeCart, itemCount } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex flex-col w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Your Cart ({itemCount})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-muted-foreground mb-4">Add some juices to get started</p>
            <Button onClick={closeCart} asChild>
              <Link to="/products">Browse Products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between text-lg font-medium">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Shipping and taxes calculated at checkout
              </p>
              <Button className="w-full" size="lg" asChild>
                <Link to="/checkout" onClick={closeCart}>
                  Checkout
                </Link>
              </Button>
              <Button variant="outline" className="w-full" onClick={closeCart}>
                Continue Shopping
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
