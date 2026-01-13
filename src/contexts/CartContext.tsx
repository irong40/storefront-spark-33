import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product } from '@/hooks/use-products';
import { toast } from 'sonner';

export interface GiftCardData {
  recipientEmail: string;
  recipientName?: string;
  message?: string;
  deliveryDate?: string;
}

export interface CartItem {
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
  addons?: { id: string; display_name: string; price: number }[];
  flavors?: { id: string; name: string }[];
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
    // Add addon prices
    if (item.addons && item.addons.length > 0) {
      itemPrice += item.addons.reduce((addonSum, addon) => addonSum + Number(addon.price), 0);
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
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        id,
        product_id,
        quantity,
        size_id,
        size_override_id,
        addon_ids,
        selected_flavor_ids,
        gift_card_data,
        product:products(id, name, slug, price, image_url, is_available)
      `)
      .eq('cart_id', id);

    if (error) {
      console.error('Error fetching cart items:', error);
      return;
    }

    if (!data) {
      setItems([]);
      return;
    }

    // Fetch related data for sizes, overrides, addons, and flavors
    const validItems = data.filter(item => item.product !== null);
    
    // Collect all IDs we need to fetch
    const sizeIds = validItems.map(i => i.size_id).filter(Boolean) as string[];
    const overrideIds = validItems.map(i => i.size_override_id).filter(Boolean) as string[];
    const allAddonIds = validItems.flatMap(i => (i.addon_ids as string[]) || []);
    const allFlavorIds = validItems.flatMap(i => (i.selected_flavor_ids as string[]) || []);

    // Fetch all related data in parallel
    const [sizesResult, overridesResult, addonsResult, flavorsResult] = await Promise.all([
      sizeIds.length > 0 
        ? supabase.from('product_sizes').select('id, name, price').in('id', sizeIds)
        : { data: [] },
      overrideIds.length > 0
        ? supabase.from('product_size_overrides').select('id, size_name, price').in('id', overrideIds)
        : { data: [] },
      allAddonIds.length > 0
        ? supabase.from('product_addons').select('id, display_name, price').in('id', allAddonIds)
        : { data: [] },
      allFlavorIds.length > 0
        ? supabase.from('products').select('id, name').in('id', allFlavorIds)
        : { data: [] },
    ]);

    // Create lookup maps
    const sizesMap = new Map((sizesResult.data || []).map(s => [s.id, s]));
    const overridesMap = new Map((overridesResult.data || []).map(o => [o.id, o]));
    const addonsMap = new Map((addonsResult.data || []).map(a => [a.id, a]));
    const flavorsMap = new Map((flavorsResult.data || []).map(f => [f.id, f]));

    // Map items with their related data
    const enrichedItems: CartItem[] = validItems.map(item => ({
      id: item.id,
      product_id: item.product_id,
      quantity: item.quantity,
      size_id: item.size_id,
      size_override_id: item.size_override_id,
      addon_ids: (item.addon_ids as string[]) || [],
      selected_flavor_ids: (item.selected_flavor_ids as string[]) || [],
      gift_card_data: item.gift_card_data as unknown as GiftCardData | null,
      product: item.product as CartItem['product'],
      size: item.size_id ? sizesMap.get(item.size_id) || null : null,
      size_override: item.size_override_id ? overridesMap.get(item.size_override_id) || null : null,
      addons: ((item.addon_ids as string[]) || [])
        .map(id => addonsMap.get(id))
        .filter(Boolean) as CartItem['addons'],
      flavors: ((item.selected_flavor_ids as string[]) || [])
        .map(id => flavorsMap.get(id))
        .filter(Boolean) as CartItem['flavors'],
    }));

    setItems(enrichedItems);
  }

  async function addItem(
    productId: string,
    quantity = 1,
    sizeId?: string,
    sizeOverrideId?: string,
    addonIds: string[] = [],
    giftCardData?: GiftCardData,
    selectedFlavorIds: string[] = []
  ) {
    if (!cartId) return;

    try {
      const insertData: Record<string, unknown> = {
        cart_id: cartId,
        product_id: productId,
        quantity,
        size_id: sizeId || null,
        size_override_id: sizeOverrideId || null,
        addon_ids: addonIds,
        selected_flavor_ids: selectedFlavorIds,
        gift_card_data: giftCardData || null,
      };

      const { error } = await supabase
        .from('cart_items')
        .insert(insertData);

      if (error) throw error;
      
      await fetchCartItems(cartId);
      toast.success('Added to cart');
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      toast.error('Failed to add item to cart');
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
      toast.error('Failed to update quantity');
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
      toast.success('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
      toast.error('Failed to remove item');
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
