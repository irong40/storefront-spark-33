// Which prices and sizes a product page offers. Shared by ProductDetail (in
// the browser) and scripts/prerender.js (at build time) so the static HTML and
// the live page quote the same prices.
//
// "sizes" are the effective sizes: the product's active size overrides when it
// has any, otherwise the global product_sizes table (useEffectiveProductSizes).

import { JUICE_CATEGORY_SLUGS } from "@/lib/product-seo";

export interface PricedSize {
  name: string;
  price: number;
}

export interface PricedVariant {
  size_name: string;
  price: number;
  is_subscription?: boolean;
  subscription_interval?: string | null;
}

export interface PricedProduct {
  slug: string;
  price: number | string | null;
  category?: { slug: string } | null;
  variants?: PricedVariant[];
}

const GIFT_CARD_SLUG = "egift-card";

/** Bundles where the shopper picks flavors; 0 means no flavor picker. */
export function flavorSelectionLimit(slug: string): number {
  switch (slug) {
    case "4-pack-sample-box":
      return 4;
    case "sample-box":
      return 4;
    case "3-pack-subscription":
      return 3;
    case "gallon-subscription":
      return 1;
    case "full-gallon-subscription":
      return 1;
    case "half-gallon-subscription":
      return 1;
    default:
      return 0;
  }
}

/** Wellness shots have a fixed price, no sizes and no add-ons. */
export function isWellnessShotSlug(slug: string | undefined): boolean {
  return !!slug?.startsWith("wellness-shot-") && slug !== "wellness-shot-subscription";
}

/** 1-day and 3-day detox packages: no sizes, no add-ons. */
export function isDetoxPackageSlug(slug: string | undefined): boolean {
  return (
    !!slug?.includes("-day-detox") ||
    slug === "1-day-detox" ||
    slug === "3-day-detox"
  );
}

/** Only the juice categories may use the global product_sizes price table. */
export function allowsGlobalSize(product: PricedProduct): boolean {
  return JUICE_CATEGORY_SLUGS.has(product.category?.slug ?? "");
}

export function showsSizeSelector(product: PricedProduct, sizeCount: number): boolean {
  const slug = product.slug;
  return (
    !product.variants?.length &&
    slug !== GIFT_CARD_SLUG &&
    sizeCount > 0 &&
    !isWellnessShotSlug(slug) &&
    !isDetoxPackageSlug(slug) &&
    product.category?.slug !== "food" &&
    (flavorSelectionLimit(slug) === 0 || slug === "4-pack-sample-box")
  );
}

/** Every price a shopper can pick on the product page. */
export function offeredPrices(product: PricedProduct, sizes: PricedSize[]): number[] {
  if (isWellnessShotSlug(product.slug)) return [Number(product.price)];
  if (product.variants && product.variants.length > 0) {
    return product.variants.map((v) => Number(v.price));
  }
  if (
    product.slug !== GIFT_CARD_SLUG &&
    allowsGlobalSize(product) &&
    showsSizeSelector(product, sizes.length)
  ) {
    return sizes.map((s) => Number(s.price));
  }
  return [Number(product.price)];
}

/**
 * The price the page shows before the shopper picks anything: the first
 * option, or the 16 oz bottle for juice (ProductDetail's default size).
 */
export function initialPrice(product: PricedProduct, sizes: PricedSize[]): number {
  if (isWellnessShotSlug(product.slug)) return Number(product.price);
  if (product.variants && product.variants.length > 0) {
    return Number(product.variants[0].price);
  }
  if (
    product.slug !== GIFT_CARD_SLUG &&
    allowsGlobalSize(product) &&
    sizes.length > 0 &&
    flavorSelectionLimit(product.slug) === 0
  ) {
    const size = sizes.find((s) => s.name === "16 oz") || sizes[0];
    return Number(size.price);
  }
  return Number(product.price);
}

/** Option labels with prices, as the page's option and size buttons offer them. */
export function priceOptions(
  product: PricedProduct,
  sizes: PricedSize[],
): { label: string; price: number }[] {
  if (isWellnessShotSlug(product.slug)) return [];
  if (product.variants && product.variants.length > 0) {
    return product.variants.map((v) => ({
      label:
        v.is_subscription && v.subscription_interval
          ? `${v.size_name} (${v.subscription_interval})`
          : v.size_name,
      price: Number(v.price),
    }));
  }
  if (
    product.slug !== GIFT_CARD_SLUG &&
    allowsGlobalSize(product) &&
    showsSizeSelector(product, sizes.length)
  ) {
    return sizes.map((s) => ({ label: s.name, price: Number(s.price) }));
  }
  return [];
}
