import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/hooks/use-products';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Pick<Product, 'id' | 'name' | 'slug' | 'price' | 'image_url' | 'is_available'>;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (productId: string, quantity?: number) => Promise<void>;
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
  const subtotal = items.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

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
      const validItems = data.filter(item => item.product !== null) as CartItem[];
      setItems(validItems);
    }
  }

  async function addItem(productId: string, quantity = 1) {
    if (!cartId) return;

    const existingItem = items.find(item => item.product_id === productId);

    if (existingItem) {
      await updateQuantity(existingItem.id, existingItem.quantity + quantity);
    } else {
      await supabase
        .from('cart_items')
        .insert({ cart_id: cartId, product_id: productId, quantity });
      
      await fetchCartItems(cartId);
    }

    setIsOpen(true);
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (!cartId) return;

    if (quantity <= 0) {
      await removeItem(itemId);
      return;
    }

    await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId);

    await fetchCartItems(cartId);
  }

  async function removeItem(itemId: string) {
    if (!cartId) return;

    await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    await fetchCartItems(cartId);
  }

  async function clearCart() {
    if (!cartId) return;

    await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cartId);

    setItems([]);
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
