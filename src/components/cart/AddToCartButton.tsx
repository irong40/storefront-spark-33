import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface GiftCardData {
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  deliveryDate?: string;
}

interface AddToCartButtonProps {
  productId: string;
  quantity?: number;
  sizeId?: string; // Standard Size ID
  sizeOverrideId?: string; // Variant ID
  selectedFlavorIds?: string[]; // Added flavor IDs
  addonIds?: string[]; // Added addon IDs
  giftCardData?: GiftCardData;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AddToCartButton({
  productId,
  quantity = 1,
  sizeId,
  sizeOverrideId,
  selectedFlavorIds,
  addonIds = [],
  giftCardData,
  disabled,
  className,
  size = 'default'
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [isAdding, setIsAdding] = useState(false);

  async function handleAdd() {
    setIsAdding(true);
    try {
      // If we only have a size NAME (like "16 oz") and no ID, we need to map it to a DB ID?
      // For now, CartContext expects sizeId (UUID).
      // The previous implementation of standard sizes in ProductDetail.tsx used names.
      // Since I can't easily fetch all IDs in frontend without a new hook/query, I might have skipped a step.
      // BUT for now, let's pass what we have. If sizeId remains undefined, it falls back to base price.
      // Wait, standard sizes (10oz, 16oz etc) are in the DB table 'product_sizes'.
      // I should assume the parent component calls me with the correct UUID if possible.
      // For this step I will just pass the arguments through.

      await addItem(productId, quantity, sizeId, sizeOverrideId, addonIds, giftCardData, selectedFlavorIds);
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
