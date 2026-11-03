// Pure helpers for server-side checkout: price the cart, build the order rows and
// apply gift cards. Kept free of Supabase/Square calls so they can be unit tested
// (checkout-order.test.ts).

// Only these categories may price off the global product_sizes table.
// Anything else (food, wellness-shots, detox-packages, subscriptions,
// uncategorized) must ignore size.price even if a stale cart row carries
// a size_id — fall through to product.price instead.
export const JUICE_SIZE_CATEGORIES = new Set([
  "sweet-treats",
  "energy-immunity-booster",
  "detox-fat-burners",
]);

export interface CartRow {
  quantity: number;
  product_id: string;
  is_subscription?: boolean | null;
  addon_ids?: string[] | null;
  selected_flavor_ids?: string[] | null;
  gift_card_data?: Record<string, unknown> | null;
  dressing?: string | null;
  product: {
    name?: string | null;
    price: number | string | null;
    slug?: string | null;
    category?: { slug?: string | null } | null;
  } | null;
  size: { price: number | string | null; name?: string | null; size_oz?: number | null } | null;
  size_override: { price: number | string | null; size_name?: string | null; size_oz?: number | null } | null;
}

export interface Addon {
  id: string;
  display_name: string;
  price: number;
}

export interface OrderLine {
  product_id: string;
  product_name: string;
  quantity: number;
  base_price: number;
  unit_price: number;
  total: number;
  size_name: string | null;
  size_price: number | null;
  is_subscription: boolean;
  addons: { id: string; display_name: string; price: number }[];
  selected_flavors: { id: string; name: string }[];
  dressing: string | null;
  gift_card_data: Record<string, unknown> | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// Same precedence process-payment has always charged: size_override > juice size > product.
export function priceCart(
  cartItems: CartRow[],
  addonsMap: Map<string, Addon>,
  flavorsMap: Map<string, string>,
): { lines: OrderLine[]; subtotal: number } {
  const lines: OrderLine[] = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const product = item.product;
    const size = item.size;
    const sizeOverride = item.size_override;
    const canUseGlobalSize = JUICE_SIZE_CATEGORIES.has(product?.category?.slug ?? "");

    let basePrice = 0;
    let sizeName: string | null = null;
    let sizePrice: number | null = null;
    if (sizeOverride && sizeOverride.price != null) {
      basePrice = Number(sizeOverride.price);
      sizeName = sizeOverride.size_name ?? null;
      sizePrice = basePrice;
    } else if (canUseGlobalSize && size && size.price != null) {
      basePrice = Number(size.price);
      sizeName = size.name ?? null;
      sizePrice = basePrice;
    } else if (product && product.price != null) {
      basePrice = Number(product.price);
    }

    const addons: OrderLine["addons"] = [];
    let unitPrice = basePrice;
    for (const addonId of item.addon_ids ?? []) {
      const addon = addonsMap.get(addonId);
      if (addon && addon.price) {
        unitPrice += addon.price;
        addons.push({ id: addon.id, display_name: addon.display_name, price: addon.price });
      }
    }

    const selectedFlavors = (item.selected_flavor_ids ?? [])
      .filter((id) => flavorsMap.has(id))
      .map((id) => ({ id, name: flavorsMap.get(id)! }));

    subtotal += unitPrice * item.quantity;
    lines.push({
      product_id: item.product_id,
      product_name: product?.name ?? "Item",
      quantity: item.quantity,
      base_price: basePrice,
      unit_price: unitPrice,
      total: round2(unitPrice * item.quantity),
      size_name: sizeName,
      size_price: sizePrice,
      is_subscription: !!item.is_subscription,
      addons,
      selected_flavors: selectedFlavors,
      dressing: item.dressing ?? null,
      gift_card_data: item.gift_card_data ?? null,
    });
  }

  return { lines, subtotal };
}

export interface GiftCardBalance {
  code: string;
  balance: number;
}

// Apply gift cards in the order given until the amount due is covered.
// Cards that would contribute nothing are dropped.
export function applyGiftCards(
  cards: GiftCardBalance[],
  amountDue: number,
): { usage: { code: string; amount: number }[]; applied: number } {
  const usage: { code: string; amount: number }[] = [];
  let remaining = round2(amountDue);
  for (const card of cards) {
    if (remaining <= 0) break;
    const amount = round2(Math.min(card.balance, remaining));
    if (amount <= 0) continue;
    usage.push({ code: card.code, amount });
    remaining = round2(remaining - amount);
  }
  return { usage, applied: round2(amountDue - remaining) };
}

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function randomChars(n: number, alphabet: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

// Format must match the redemption regex in Checkout.tsx: GC-XXXX-XXXX-XXXX
export function generateGiftCardCode(): string {
  return `GC-${randomChars(4, CODE_CHARS)}-${randomChars(4, CODE_CHARS)}-${randomChars(4, CODE_CHARS)}`;
}

// Same shape as src/lib/utils.ts generateOrderNumber: ORD-YYYYMMDD-XXXX
export function generateOrderNumber(now = new Date()): string {
  const date = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `ORD-${date}-${randomChars(4, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")}`;
}

export interface GiftCardToIssue {
  id: string;
  code: string;
  amount: number;
  recipient_email: string | null;
  recipient_name: string | null;
  is_for_self: boolean;
  personal_message: string | null;
  delivery_date: string;
}

// One card per unit of every gift-card line. The card's value is the price the
// server charged for that line, never an amount the browser put in gift_card_data.
export function giftCardsToIssue(lines: OrderLine[], today: string): GiftCardToIssue[] {
  const cards: GiftCardToIssue[] = [];
  for (const line of lines) {
    const gcd = line.gift_card_data;
    if (!gcd) continue;
    const isSelf = gcd.recipientType === "myself";
    const requested = typeof gcd.deliveryDate === "string" ? gcd.deliveryDate.slice(0, 10) : today;
    const deliveryDate = isSelf || requested < today ? today : requested;
    for (let i = 0; i < line.quantity; i++) {
      cards.push({
        id: crypto.randomUUID(),
        code: generateGiftCardCode(),
        amount: round2(line.base_price),
        recipient_email: isSelf ? null : (typeof gcd.recipientEmail === "string" ? gcd.recipientEmail : null),
        recipient_name: isSelf ? null : (typeof gcd.recipientName === "string" ? gcd.recipientName : null),
        is_for_self: isSelf,
        personal_message: typeof gcd.message === "string" ? gcd.message : null,
        delivery_date: deliveryDate,
      });
    }
  }
  return cards;
}
