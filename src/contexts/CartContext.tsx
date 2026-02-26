import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/hooks/use-products";
import { toast } from "sonner";
import { logger } from "@/lib/logger";

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
  product: Pick<
    Product,
    "id" | "name" | "slug" | "price" | "image_url" | "is_available"
  >;
  size?: { id: string; name: string; price: number } | null;
  size_override?: { id: string; size_name: string; price: number } | null;
  addons?: { id: string; display_name: string; price: number }[];
  flavors?: { id: string; name: string }[];
}

interface ReorderItem {
  product_id: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;
  isMutating: boolean;
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
    selectedFlavorIds?: string[],
  ) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  reorderItems: (
    items: ReorderItem[],
  ) => Promise<{ success: boolean; addedCount: number; skippedCount: number }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const SESSION_ID_KEY = "cart_session_id";
const SESSION_TS_KEY = "cart_session_id_ts";
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getSessionId(): string {
  const stored = localStorage.getItem(SESSION_ID_KEY);
  const ts = localStorage.getItem(SESSION_TS_KEY);
  const now = Date.now();

  // Validate existing session: must exist and be less than 24 hours old
  if (stored && ts && now - Number(ts) < SESSION_TTL_MS) {
    return stored;
  }

  // Generate a fresh session
  const sessionId = crypto.randomUUID();
  localStorage.setItem(SESSION_ID_KEY, sessionId);
  localStorage.setItem(SESSION_TS_KEY, String(now));
  return sessionId;
}

// Debounce helper — trailing edge, returns a cancel function
function debounce<T extends unknown[]>(
  fn: (...args: T) => Promise<void>,
  delay: number,
): [(...args: T) => void, () => void] {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: T) => {
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, delay);
  };
  const cancel = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return [debounced, cancel];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [cartId, setCartId] = useState<string | null>(null);

  // Mutex: prevent concurrent mutations from racing each other.
  // All mutation calls enqueue themselves and run sequentially.
  const mutexRef = useRef<Promise<void>>(Promise.resolve());

  // AbortController ref: cancel any in-flight fetchCartItems when a new
  // fetch is initiated so stale responses never overwrite newer state.
  const fetchAbortRef = useRef<AbortController | null>(null);

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
      itemPrice += item.addons.reduce(
        (addonSum, addon) => addonSum + Number(addon.price),
        0,
      );
    }
    return sum + itemPrice * item.quantity;
  }, 0);

  // Core fetch: cancels any previous in-flight call via AbortController.
  // The signal is threaded into the Supabase queries where supported.
  const fetchCartItems = useCallback(async (id: string): Promise<void> => {
    // Cancel the previous in-flight fetch
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;

    const { data, error } = await supabase
      .from("cart_items")
      .select(
        `
        id,
        product_id,
        quantity,
        size_id,
        size_override_id,
        addon_ids,
        selected_flavor_ids,
        gift_card_data,
        product:products(id, name, slug, price, image_url, is_available)
      `,
      )
      .eq("cart_id", id)
      .abortSignal(controller.signal);

    // If this fetch was cancelled by a newer call, discard results silently
    if (controller.signal.aborted) return;

    if (error) {
      logger.error("Error fetching cart items:", error);
      return;
    }

    if (!data) {
      setItems([]);
      return;
    }

    // Filter out items whose product join returned null (deleted products)
    const validItems = data.filter((item) => item.product !== null);

    // Batch collect all related IDs in a single pass
    const sizeIds = validItems
      .map((i) => i.size_id)
      .filter(Boolean) as string[];
    const overrideIds = validItems
      .map((i) => i.size_override_id)
      .filter(Boolean) as string[];
    const allAddonIds = validItems.flatMap(
      (i) => (i.addon_ids as string[]) || [],
    );
    const allFlavorIds = validItems.flatMap(
      (i) => (i.selected_flavor_ids as string[]) || [],
    );

    // Fetch all related data in a single parallel round-trip
    const [sizesResult, overridesResult, addonsResult, flavorsResult] =
      await Promise.all([
        sizeIds.length > 0
          ? supabase
              .from("product_sizes")
              .select("id, name, price")
              .in("id", sizeIds)
              .abortSignal(controller.signal)
          : { data: [] },
        overrideIds.length > 0
          ? supabase
              .from("product_size_overrides")
              .select("id, size_name, price")
              .in("id", overrideIds)
              .abortSignal(controller.signal)
          : { data: [] },
        allAddonIds.length > 0
          ? supabase
              .from("product_addons")
              .select("id, display_name, price")
              .in("id", allAddonIds)
              .abortSignal(controller.signal)
          : { data: [] },
        allFlavorIds.length > 0
          ? supabase
              .from("products")
              .select("id, name")
              .in("id", allFlavorIds)
              .abortSignal(controller.signal)
          : { data: [] },
      ]);

    // Discard if cancelled mid-flight
    if (controller.signal.aborted) return;

    // Build O(1) lookup maps
    const sizesMap = new Map((sizesResult.data || []).map((s) => [s.id, s]));
    const overridesMap = new Map(
      (overridesResult.data || []).map((o) => [o.id, o]),
    );
    const addonsMap = new Map((addonsResult.data || []).map((a) => [a.id, a]));
    const flavorsMap = new Map(
      (flavorsResult.data || []).map((f) => [f.id, f]),
    );

    // Enrich each cart item with its resolved relations
    const enrichedItems: CartItem[] = validItems.map((item) => ({
      id: item.id,
      product_id: item.product_id ?? "",
      quantity: item.quantity,
      size_id: item.size_id,
      size_override_id: item.size_override_id,
      addon_ids: (item.addon_ids as string[]) || [],
      selected_flavor_ids: (item.selected_flavor_ids as string[]) || [],
      gift_card_data: item.gift_card_data as unknown as GiftCardData | null,
      product: item.product as CartItem["product"],
      size: item.size_id ? sizesMap.get(item.size_id) || null : null,
      size_override: item.size_override_id
        ? overridesMap.get(item.size_override_id) || null
        : null,
      addons: ((item.addon_ids as string[]) || [])
        .map((id) => addonsMap.get(id))
        .filter(Boolean) as CartItem["addons"],
      flavors: ((item.selected_flavor_ids as string[]) || [])
        .map((id) => flavorsMap.get(id))
        .filter(Boolean) as CartItem["flavors"],
    }));

    setItems(enrichedItems);
  }, []);

  // Debounced wrapper: collapses rapid sequential fetch calls (e.g. from
  // fast +/- clicks) into a single network round-trip after 300 ms of quiet.
  const [debouncedFetch, cancelDebouncedFetch] = debounce(fetchCartItems, 300);

  useEffect(() => {
    async function initCart() {
      setIsLoading(true);
      try {
        let { data: cart } = await supabase
          .from("carts")
          .select("id")
          .eq("session_id", sessionId)
          .single();

        if (!cart) {
          const { data: newCart } = await supabase
            .from("carts")
            .insert({ session_id: sessionId })
            .select("id")
            .single();
          cart = newCart;
        }

        if (cart) {
          setCartId(cart.id);
          // Initial load is not debounced — fetch immediately
          await fetchCartItems(cart.id);
        }
      } catch (error) {
        logger.error("Error initializing cart:", error);
      } finally {
        setIsLoading(false);
      }
    }

    initCart();

    return () => {
      // On unmount, cancel any pending debounced fetch and abort in-flight requests
      cancelDebouncedFetch();
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Enqueue a mutation: waits for any running mutation to complete first,
  // then runs the provided async work, then triggers a debounced re-fetch.
  // This is the mutex pattern — sequential, never concurrent.
  function enqueue(
    work: () => Promise<void>,
    refetchId: string | null,
    options?: { immediate?: boolean },
  ): Promise<void> {
    const next = mutexRef.current.then(async () => {
      setIsMutating(true);
      try {
        await work();
        if (refetchId) {
          if (options?.immediate) {
            await fetchCartItems(refetchId);
          } else {
            debouncedFetch(refetchId);
          }
        }
      } finally {
        setIsMutating(false);
      }
    });
    mutexRef.current = next.catch(() => {
      // Prevent unhandled rejection from poisoning the mutex chain
    });
    return next;
  }

  async function addItem(
    productId: string,
    quantity = 1,
    sizeId?: string,
    sizeOverrideId?: string,
    addonIds: string[] = [],
    giftCardData?: GiftCardData,
    selectedFlavorIds: string[] = [],
  ) {
    if (!cartId) return;

    return enqueue(
      async () => {
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

        const { error } = await supabase.from("cart_items").insert(insertData);
        if (error) throw error;

        toast.success("Added to cart");
        setIsOpen(true);
      },
      cartId,
      // addItem uses an immediate fetch so the cart drawer opens with fresh data
      { immediate: true },
    );
  }

  async function updateQuantity(itemId: string, quantity: number) {
    if (!cartId) return;

    if (quantity <= 0) {
      return removeItem(itemId);
    }

    return enqueue(async () => {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);
      if (error) throw error;
    }, cartId);
  }

  async function removeItem(itemId: string) {
    if (!cartId) return;

    return enqueue(
      async () => {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("id", itemId);
        if (error) throw error;

        toast.success("Item removed from cart");
      },
      cartId,
      { immediate: true },
    );
  }

  async function clearCart() {
    if (!cartId) return;

    // clearCart is called from Checkout after order submission — use direct
    // fetch so callers can await a settled state before navigating.
    return enqueue(
      async () => {
        const { error } = await supabase
          .from("cart_items")
          .delete()
          .eq("cart_id", cartId);
        if (error) throw error;

        setItems([]);
      },
      null, // No re-fetch needed — we cleared to empty in the mutation itself
    );
  }

  async function reorderItems(
    orderItems: ReorderItem[],
  ): Promise<{ success: boolean; addedCount: number; skippedCount: number }> {
    if (!cartId) return { success: false, addedCount: 0, skippedCount: 0 };

    let addedCount = 0;
    let skippedCount = 0;

    await enqueue(
      async () => {
        // Check which products are still available
        const productIds = orderItems
          .map((item) => item.product_id)
          .filter(Boolean);

        const { data: availableProducts } = await supabase
          .from("products")
          .select("id, is_available, active")
          .in("id", productIds)
          .eq("is_available", true)
          .eq("active", true);

        const availableIds = new Set(
          availableProducts?.map((p) => p.id) || [],
        );

        for (const item of orderItems) {
          if (item.product_id && availableIds.has(item.product_id)) {
            const { error } = await supabase.from("cart_items").insert({
              cart_id: cartId,
              product_id: item.product_id,
              quantity: item.quantity,
              size_id: null,
              size_override_id: null,
              addon_ids: [],
              selected_flavor_ids: [],
              gift_card_data: null,
            });

            if (!error) {
              addedCount++;
            } else {
              skippedCount++;
            }
          } else {
            skippedCount++;
          }
        }

        if (addedCount > 0) {
          setIsOpen(true);
        }
      },
      cartId,
      { immediate: true },
    );

    return {
      success: addedCount > 0,
      addedCount,
      skippedCount,
    };
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        isLoading,
        isMutating,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        reorderItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
