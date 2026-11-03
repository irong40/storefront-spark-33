import { assert, assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import {
  applyGiftCards,
  type CartRow,
  generateGiftCardCode,
  generateOrderNumber,
  giftCardsToIssue,
  priceCart,
} from "./checkout-order.ts";

const juice = (over: Partial<CartRow> = {}): CartRow => ({
  quantity: 1,
  product_id: "p-juice",
  product: { name: "Green Juice", price: 8, category: { slug: "detox-fat-burners" } },
  size: null,
  size_override: null,
  ...over,
});

Deno.test("price precedence: override > juice size > product", () => {
  const { lines, subtotal } = priceCart([
    juice({ size_override: { price: 12, size_name: "16oz" }, size: { price: 10, name: "16 oz" } }),
    juice({ size: { price: 10, name: "16 oz" } }),
    juice(),
  ], new Map(), new Map());
  assertEquals(lines.map((l) => l.unit_price), [12, 10, 8]);
  assertEquals(lines[0].size_name, "16oz");
  assertEquals(subtotal, 30);
});

Deno.test("non-juice categories ignore a stale global size", () => {
  const { lines } = priceCart([
    juice({ product: { name: "Wrap", price: 11, category: { slug: "food" } }, size: { price: 5, name: "16 oz" } }),
  ], new Map(), new Map());
  assertEquals(lines[0].unit_price, 11);
  assertEquals(lines[0].size_name, null);
});

Deno.test("addons, quantity, flavors and dressing carry into the line", () => {
  const addons = new Map([["a1", { id: "a1", display_name: "Ginger", price: 1.5 }]]);
  const flavors = new Map([["f1", "Mango"]]);
  const { lines, subtotal } = priceCart([
    juice({ quantity: 2, addon_ids: ["a1", "missing"], selected_flavor_ids: ["f1", "gone"], dressing: "Ranch" }),
  ], addons, flavors);
  assertEquals(lines[0].unit_price, 9.5);
  assertEquals(lines[0].total, 19);
  assertEquals(subtotal, 19);
  assertEquals(lines[0].addons, [{ id: "a1", display_name: "Ginger", price: 1.5 }]);
  assertEquals(lines[0].selected_flavors, [{ id: "f1", name: "Mango" }]);
  assertEquals(lines[0].dressing, "Ranch");
});

Deno.test("gift cards cover in order and never exceed the amount due", () => {
  const r = applyGiftCards([{ code: "A", balance: 10 }, { code: "B", balance: 50 }, { code: "C", balance: 5 }], 32.4);
  assertEquals(r.usage, [{ code: "A", amount: 10 }, { code: "B", amount: 22.4 }]);
  assertEquals(r.applied, 32.4);
  assertEquals(applyGiftCards([{ code: "A", balance: 5 }], 20).applied, 5);
  assertEquals(applyGiftCards([], 20).usage, []);
});

Deno.test("issued gift card value is the charged price, not gift_card_data.amount", () => {
  const { lines } = priceCart([
    juice({
      quantity: 2,
      product: { name: "eGift Card", price: 25, category: { slug: "subscriptions" } },
      size_override: { price: 50, size_name: "$50" },
      gift_card_data: { amount: 500, recipientType: "someone_else", recipientEmail: "r@example.com", deliveryDate: "2026-12-25" },
    }),
  ], new Map(), new Map());
  const cards = giftCardsToIssue(lines, "2026-11-04");
  assertEquals(cards.length, 2);
  assertEquals(cards.map((c) => c.amount), [50, 50]);
  assertEquals(cards[0].recipient_email, "r@example.com");
  assertEquals(cards[0].delivery_date, "2026-12-25");
  assert(cards[0].code !== cards[1].code);
});

Deno.test("self gift cards and past dates deliver today", () => {
  const { lines } = priceCart([
    juice({ product: { name: "eGift Card", price: 25 }, gift_card_data: { recipientType: "myself", recipientEmail: "x@example.com" } }),
    juice({ product: { name: "eGift Card", price: 25 }, gift_card_data: { recipientType: "someone_else", deliveryDate: "2020-01-01" } }),
  ], new Map(), new Map());
  const cards = giftCardsToIssue(lines, "2026-11-04");
  assertEquals(cards[0].recipient_email, null);
  assertEquals(cards[0].is_for_self, true);
  assertEquals(cards.map((c) => c.delivery_date), ["2026-11-04", "2026-11-04"]);
});

Deno.test("code and order number formats", () => {
  assert(/^GC-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(generateGiftCardCode()));
  assert(/^ORD-20261104-[A-Z0-9]{4}$/.test(generateOrderNumber(new Date("2026-11-04T15:00:00Z"))));
});
