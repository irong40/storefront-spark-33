import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AddToCartButton({ productId, quantity = 1, disabled, className, size = 'default' }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd() {
    setIsAdding(true);
    try {
      await addItem(productId, quantity);
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <Button 
      onClick={handleAdd} 
      disabled={disabled || isAdding}
      className={className}
      size={size}
    >
      {isAdding ? (
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <ShoppingCart className="h-4 w-4 mr-2" />
      )}
      Add to Cart
    </Button>
  );
}
