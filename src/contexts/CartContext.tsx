import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/hooks/use-products';

interface GiftCardData {
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  deliveryDate?: string;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  size_id: string | null;
  size_override_id: string | null;
  addon_ids: string[];
  selected_flavor_ids: string[];
  gift_card_data: GiftCardData | null;
  product: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'image_url' | 'is_available'>;
  size?: { id: string; name: string; price: number } | null;
  size_override?: { id: string; size_name: string; price: number } | null;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (
    productId: string,
    quantity?: number,
    sizeId?: string,
    sizeOverrideId?: string,
    addonIds?: string[],
    giftCardData?: GiftCardData,
    selectedFlavorIds?: string[]
  ) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getSessionId(): string {
  let sessionId = localStorage.getItem('cart_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem('cart_session_id', sessionId);
  }
  return sessionId;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);

  const sessionId = getSessionId();

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => {
    // Prioritize variant override price, then standard size price, then base price
    let itemPrice = Number(item.product.price);
    if (item.size_override) {
      itemPrice = Number(item.size_override.price);
    } else if (item.size) {
      itemPrice = Number(item.size.price);
    }
    return sum + (itemPrice * item.quantity);
  }, 0);

  useEffect(() => {
    async function initCart() {
      setIsLoading(true);
      try {
        let { data: cart } = await supabase
          .from('carts')
          .select('id')
          .eq('session_id', sessionId)
          .single();

        if (!cart) {
          const { data: newCart } = await supabase
            .from('carts')
            .insert({ session_id: sessionId })
            .select('id')
            .single();
          cart = newCart;
        }

        if (cart) {
          setCartId(cart.id);
          await fetchCartItems(cart.id);
        }
      } catch (error) {
        console.error('Error initializing cart:', error);
      } finally {
        setIsLoading(false);
      }
    }

    initCart();
  }, [sessionId]);

  async function fetchCartItems(id: string) {
    // Note: cart_items table only has basic columns (id, cart_id, product_id, quantity)
    // Additional variant columns need to be added via migration
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        product:products(id, name, slug, price, image_url, is_available)
      `)
      .eq('cart_id', id);

    if (!error && data) {
      // Map to CartItem interface with default values for missing columns
      const validItems = data
        .filter(item => item.product !== null)
        .map(item => ({
          ...item,
          size_id: null,
          size_override_id: null,
          addon_ids: [],
          selected_flavor_ids: [],
          gift_card_data: null,
          size: null,
          size_override: null,
        })) as unknown as CartItem[];
      setItems(validItems);
    }
  }

  async function addItem(
    productId: string,
    quantity = 1,
    sizeId?: string,
    sizeOverrideId?: string,
    addonIds?: string[],
    giftCardData?: GiftCardData,
    selectedFlavorIds?: string[]
  ) {
    if (!cartId) return;

    try {
      // Note: Only inserting columns that exist in the database
      // Variant columns (size_id, addon_ids, etc.) need migration to be added
      const { error } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: productId,
          quantity,
        });

      if (error) throw error;
      await fetchCartItems(cartId);

      setIsOpen(true);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (!cartId) return;

    try {
      if (quantity <= 0) {
        await removeItem(itemId);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId);

      if (error) throw error;
      await fetchCartItems(cartId);
    } catch (error) {
      console.error('Failed to update cart item quantity:', error);
    }
  }

  async function removeItem(itemId: string) {
    if (!cartId) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
      await fetchCartItems(cartId);
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
    }
  }

  async function clearCart() {
    if (!cartId) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cartId);

      if (error) throw error;
      setItems([]);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  }

  return (
    <CartContext.Provider value={{
      items,
      itemCount,
      subtotal,
      isLoading,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
