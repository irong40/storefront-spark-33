// Search-facing text and JSON-LD for product pages.
//
// Prices passed in here must be the prices the page actually offers (size
// overrides, global juice sizes or the fixed product price), never the
// products.price column on its own: that column holds a $7.00 placeholder for
// several items whose real prices live in product_size_overrides.

import { HOURS_SUMMARY, STREET_ADDRESS } from "@/config/business";

export const SITE_URL = "https://www.impressivejb.com";
export const BUSINESS_ID = `${SITE_URL}/#business`;
const BRAND = "imPRESSive Juice Bar";

const TITLE_MAX = 60;
const DESCRIPTION_MIN = 140;
const DESCRIPTION_MAX = 155;

/** Categories whose products are bottled cold-pressed juice. */
export const JUICE_CATEGORY_SLUGS = new Set([
  "sweet-treats",
  "energy-immunity-booster",
  "detox-fat-burners",
]);

interface SeoProduct {
  name: string;
  slug: string;
  description: string | null;
  short_description: string | null;
  ingredients: string | null;
  category?: { name: string; slug: string } | null;
}

export function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("//")) return `https:${url}`;
  return `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

/** "$4", "$6.50", "$114.95" */
export function formatPrice(price: number): string {
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`;
}

const GIFT_CARD_SLUG = "egift-card";

/** Collapse whitespace; DB copy can carry em dashes, which read as commas. */
function clean(text: string | null | undefined): string {
  return (text ?? "")
    .replace(/\s*\u2014\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

function endSentence(text: string): string {
  return /[.!?]$/.test(text) ? text : `${text}.`;
}

/** "Kale | Lime | Apple" -> "kale, lime and apple". Null when not a list. */
export function ingredientList(ingredients: string | null): string | null {
  if (!ingredients || !ingredients.includes("|")) return null;
  const items = ingredients
    .split("|")
    .map((i) => i.trim().toLowerCase())
    .filter(Boolean);
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

// Words a cut sentence must not end on ("croutons, and.").
const DANGLING = /\s+(and|or|with|of|the|a|an|to|for|in|on|at|from|by|your)$/i;

function cutAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max + 1);
  const space = cut.lastIndexOf(" ");
  let out = cut.slice(0, space > 0 ? space : max).replace(/[,;:.\s]+$/, "");
  while (DANGLING.test(out)) out = out.replace(DANGLING, "").replace(/[,;:\s]+$/, "");
  return out;
}

/**
 * Juice gets a "Cold-Pressed Juice" suffix; food, shots, packages and gift
 * cards do not. Falls back to shorter brand forms to stay within ~60 chars.
 */
export function productTitle(product: SeoProduct): string {
  const name = clean(product.name);
  const isJuice = JUICE_CATEGORY_SLUGS.has(product.category?.slug ?? "");
  const candidates = isJuice
    ? [
        `${name} Cold-Pressed Juice | imPRESSive Portsmouth`,
        `${name} Cold-Pressed Juice | imPRESSive`,
        `${name} | imPRESSive Juice Bar Portsmouth`,
        `${name} | ${BRAND}`,
        `${name} | imPRESSive`,
      ]
    : [
        `${name} | imPRESSive Juice Bar Portsmouth`,
        `${name} | ${BRAND}`,
        `${name} | imPRESSive`,
      ];
  const fit = candidates.find((t) => t.length <= TITLE_MAX);
  if (fit) return fit;
  const suffix = " | imPRESSive";
  return `${cutAtWord(name, TITLE_MAX - suffix.length)}${suffix}`;
}

/**
 * 140-155 character meta description built from ingredients (or the short
 * description), the offered price, Portsmouth and pickup.
 */
export function productDescription(
  product: SeoProduct,
  prices: number[],
): string {
  const name = clean(product.name);
  const slug = product.category?.slug ?? "";
  const ingredients = ingredientList(product.ingredients);
  const blurb = [product.short_description, product.description]
    .map(clean)
    .find((t) => t && t.toLowerCase() !== name.toLowerCase());

  let lead: string;
  if (ingredients && JUICE_CATEGORY_SLUGS.has(slug)) {
    lead = `${name} cold-pressed juice: ${ingredients}.`;
  } else if (ingredients && slug === "wellness-shots") {
    lead = `${name}: a cold-pressed shot of ${ingredients}.`;
  } else if (ingredients) {
    lead = `${name}: ${ingredients}.`;
  } else if (blurb) {
    lead = `${name}: ${endSentence(blurb)}`;
  } else {
    lead = `${name} from ${BRAND}.`;
  }

  const valid = prices.filter((p) => Number.isFinite(p) && p > 0);
  const min = valid.length ? Math.min(...valid) : null;
  const max = valid.length ? Math.max(...valid) : null;
  const price =
    min === null ? "" : min === max ? `${formatPrice(min)}.` : `From ${formatPrice(min)}.`;

  // Gift cards are emailed, not picked up or made.
  const isGiftCard = product.slug === GIFT_CARD_SLUG;
  const places = isGiftCard
    ? [`Sold by ${BRAND} in Portsmouth, VA.`, "Portsmouth, VA."]
    : [
        `Made fresh by ${BRAND} at ${STREET_ADDRESS}, Portsmouth, VA.`,
        `Made fresh at ${STREET_ADDRESS}, Portsmouth, VA.`,
        "Made fresh in Portsmouth, VA.",
      ];
  const pickups = isGiftCard
    ? ["Buy online and send it by email.", "Sent by email."]
    : [
        `Order online for pickup, ${HOURS_SUMMARY}.`,
        "Order online for pickup.",
      ];

  // Options run longest-first; the first one inside 140-155 wins, otherwise
  // the longest that fits under 155.
  const options: string[] = [];
  for (const pl of places) {
    for (const pu of pickups) {
      options.push([lead, price, pl, pu].filter(Boolean).join(" "));
    }
  }
  const fitting = options.filter((o) => o.length <= DESCRIPTION_MAX);
  if (fitting.length) {
    const inRange = fitting.find((o) => o.length >= DESCRIPTION_MIN);
    return inRange ?? fitting.reduce((a, b) => (b.length > a.length ? b : a));
  }

  // Lead too long: shorten it and keep the price, place and pickup tail.
  const tail = [price, places[places.length - 1], pickups[pickups.length - 1]]
    .filter(Boolean)
    .join(" ");
  const room = DESCRIPTION_MAX - tail.length - 2;
  return `${endSentence(cutAtWord(lead, Math.max(room, 20)))} ${tail}`;
}

/** Image alt text that says what the picture shows, not just the name. */
export function productImageAlt(product: SeoProduct): string {
  const name = clean(product.name);
  const ingredients = ingredientList(product.ingredients);
  const slug = product.category?.slug ?? "";
  if (ingredients && JUICE_CATEGORY_SLUGS.has(slug)) {
    return `${name} cold-pressed juice made with ${ingredients}`;
  }
  if (ingredients && slug === "wellness-shots") {
    return `${name}, made with ${ingredients}`;
  }
  return `${name} from ${BRAND}`;
}

interface ProductJsonLdInput {
  product: SeoProduct & { sku?: string | null; is_available: boolean };
  prices: number[];
  canonicalUrl: string;
  imageUrl: string | null;
}

/** Product + Offer/AggregateOffer + BreadcrumbList as one @graph. */
export function productJsonLd({
  product,
  prices,
  canonicalUrl,
  imageUrl,
}: ProductJsonLdInput) {
  const valid = prices.filter((p) => Number.isFinite(p) && p > 0);
  const availability = product.is_available
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
  const offerBase = {
    priceCurrency: "USD",
    availability,
    url: canonicalUrl,
    // Pickup only. Gift cards are emailed, so they carry no pickup method.
    ...(product.slug === GIFT_CARD_SLUG
      ? {}
      : { availableDeliveryMethod: "https://schema.org/OnSitePickup" }),
    seller: { "@id": BUSINESS_ID },
  };
  const low = valid.length ? Math.min(...valid) : null;
  const high = valid.length ? Math.max(...valid) : null;
  const offers =
    low === null
      ? undefined
      : low === high
        ? { "@type": "Offer", price: low.toFixed(2), ...offerBase }
        : {
            "@type": "AggregateOffer",
            lowPrice: low.toFixed(2),
            highPrice: (high as number).toFixed(2),
            offerCount: valid.length,
            ...offerBase,
          };

  const description = clean(product.description) || clean(product.short_description);
  const crumbs = [
    { name: "Home", item: `${SITE_URL}/` },
    { name: "Menu", item: `${SITE_URL}/products` },
    ...(product.category
      ? [
          {
            name: product.category.name,
            item: `${SITE_URL}/products?category=${product.category.slug}`,
          },
        ]
      : []),
    { name: clean(product.name), item: canonicalUrl },
  ];

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${canonicalUrl}#product`,
        name: clean(product.name),
        ...(description ? { description } : {}),
        ...(imageUrl ? { image: [absoluteUrl(imageUrl)] } : {}),
        url: canonicalUrl,
        ...(product.sku ? { sku: product.sku } : {}),
        ...(product.category ? { category: product.category.name } : {}),
        brand: { "@type": "Brand", name: BRAND },
        ...(offers ? { offers } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: crumbs.map((c, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: c.name,
          item: c.item,
        })),
      },
    ],
  };
}

/** JSON for a <script type="application/ld+json">, safe against "</script>". */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
