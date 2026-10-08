// Build-time static HTML for crawlers that do not run JavaScript (GPTBot,
// ClaudeBot, PerplexityBot, social link previews).
//
// scripts/prerender.js bundles this module after `vite build`, fetches the
// catalog from Supabase and writes one HTML file per public route. Each file is
// the normal SPA shell with:
//   - the route's own <title>, description, canonical, Open Graph and Twitter
//     tags (seoTags(), the same function <PageSeo> uses), and
//   - a plain snapshot of the page's main text inside <div id="root">.
// main.tsx mounts with createRoot(), which clears #root before the first
// render, so browsers get the same SPA as before. The snapshot only carries
// copy the live page also shows (shared through page-content.ts,
// category-seo.ts, product-seo.ts and product-pricing.ts).
//
// No React and no DOM here: plain strings, so it runs in Node. It lives in src/
// so Tailwind keeps the classes the snapshot uses.

import {
  BUSINESS_EMAIL,
  BUSINESS_PHONE,
  CITY,
  FALLBACK_HOURS,
  PICKUP_LOCATION_NAME,
  STATE,
  STREET_ADDRESS,
  ZIP,
} from "@/config/business";
import {
  ABOUT_PAGE,
  CONTACT_PAGE,
  HOME_HERO,
  NOT_FOUND_PAGE,
  PAGE_SEO,
  PRIVACY_PAGE,
  PRODUCTS_PAGE,
  TERMS_PAGE,
  type LegalPage,
} from "@/config/page-content";
import { formatHoursLines } from "@/lib/format-hours";
import { optimizedImageSrc } from "@/lib/image-url";
import {
  initialPrice,
  offeredPrices,
  priceOptions,
  type PricedSize,
  type PricedVariant,
} from "@/lib/product-pricing";
import {
  JUICE_CATEGORY_SLUGS,
  SITE_URL,
  jsonLdString,
  productDescription,
  productImageAlt,
  productJsonLd,
  productTitle,
} from "@/lib/product-seo";
import { seoTags, type SeoInput, type SeoTags } from "@/lib/seo-meta";

export interface PrerenderBusiness {
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  hours: Record<string, string> | null;
  description: string | null;
  social_links: Record<string, string> | null;
}

export interface PrerenderProduct {
  slug: string;
  name: string;
  price: number | string | null;
  description: string | null;
  short_description: string | null;
  ingredients: string | null;
  features: string[] | null;
  image_url: string | null;
  sku?: string | null;
  is_available: boolean;
  category: { name: string; slug: string } | null;
  /** Active product_size_overrides, sort_order ascending. */
  variants: PricedVariant[];
}

export interface PrerenderData {
  /** null when the catalog could not be fetched: static routes only. */
  business: PrerenderBusiness | null;
  /** Active and available, in menu order (useProducts()). */
  products: PrerenderProduct[];
  /** useFeaturedProducts(): active, featured, first 4 by sort_order. */
  featured: PrerenderProduct[];
  /** Active categories by sort_order. */
  categories: { name: string; slug: string }[];
  /** Active global product_sizes by sort_order. */
  globalSizes: PricedSize[];
}

export interface PrerenderedPage {
  /** URL path, for logs. */
  route: string;
  /** Output file relative to dist/. */
  file: string;
  html: string;
}

// ---------------------------------------------------------------------------
// HTML helpers

function esc(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const money = (n: number) => `$${n.toFixed(2)}`;

/**
 * Swap the shell's head tags for the route's. Tags marked data-rh="true" are
 * owned by react-helmet-async, which replaces them when the page mounts, so
 * the browser never ends up with two copies.
 */
export function applyHead(shell: string, tags: SeoTags, jsonLd?: string): string {
  const meta: string[] = [
    `<meta name="description" content="${esc(tags.description)}" data-rh="true" />`,
  ];
  if (tags.canonical) {
    meta.push(`<link rel="canonical" href="${esc(tags.canonical)}" data-rh="true" />`);
  }
  meta.push(
    `<meta property="og:title" content="${esc(tags.title)}" data-rh="true" />`,
    `<meta property="og:description" content="${esc(tags.description)}" data-rh="true" />`,
  );
  if (tags.canonical) {
    meta.push(`<meta property="og:url" content="${esc(tags.canonical)}" data-rh="true" />`);
  }
  meta.push(
    `<meta property="og:image" content="${esc(tags.image)}" data-rh="true" />`,
    `<meta property="og:type" content="${esc(tags.type)}" data-rh="true" />`,
    `<meta name="twitter:title" content="${esc(tags.title)}" data-rh="true" />`,
    `<meta name="twitter:description" content="${esc(tags.description)}" data-rh="true" />`,
    `<meta name="twitter:image" content="${esc(tags.image)}" data-rh="true" />`,
  );
  if (tags.noindex) {
    meta.push(`<meta name="robots" content="noindex, nofollow" data-rh="true" />`);
  }
  if (jsonLd) {
    meta.push(`<script type="application/ld+json" data-rh="true">${jsonLd}</script>`);
  }

  // Drop the shell's generic copies of the tags this route sets.
  let html = shell.replace(/[ \t]*<meta\b[^>]*\bdata-rh="true"[^>]*>\s*\n?/g, "");
  if (!/<title>[\s\S]*?<\/title>/.test(html)) {
    throw new Error("prerender: shell has no <title>");
  }
  html = html.replace(
    /<title>[\s\S]*?<\/title>/,
    () => `<title>${esc(tags.title)}</title>\n    ${meta.join("\n    ")}`,
  );
  return html;
}

export function applyBody(shell: string, body: string): string {
  const marker = '<div id="root"></div>';
  if (!shell.includes(marker)) throw new Error("prerender: shell has no empty #root");
  return shell.replace(marker, () => `<div id="root">${body}</div>`);
}

// ---------------------------------------------------------------------------
// Shared page chrome (a plain version of Header and Footer)

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Menu" },
  { href: "/about", label: "Our Story" },
  { href: "/contact", label: "Contact" },
];

function address(b: PrerenderBusiness | null) {
  return {
    line1: b?.address_line1 || STREET_ADDRESS,
    city: b?.city || CITY,
    state: b?.state || STATE,
    zip: b?.zip || ZIP,
  };
}

function hoursLines(b: PrerenderBusiness | null): string[] {
  return formatHoursLines(b?.hours ?? FALLBACK_HOURS);
}

function telHref(phone: string): string {
  return `tel:${phone.replace(/[^0-9]/g, "")}`;
}

function header(): string {
  const links = NAV_LINKS.map(
    (l) => `<li><a href="${l.href}" class="hover:text-brand-berry">${esc(l.label)}</a></li>`,
  ).join("");
  return `<header class="border-b border-brand-terracotta/20 bg-background">
<div class="container flex flex-wrap items-center justify-between gap-4 py-4">
<a href="/" class="font-display text-2xl text-brand-brown">imPRESSive Juice Bar</a>
<nav aria-label="Main"><ul class="flex flex-wrap gap-6 text-brand-brown">${links}<li><a href="/products" class="hover:text-brand-berry">Order Now</a></li></ul></nav>
</div>
</header>`;
}

function footer(data: PrerenderData): string {
  const b = data.business;
  const a = address(b);
  const phone = b?.phone || BUSINESS_PHONE;
  const email = b?.email || BUSINESS_EMAIL;
  const categoryLinks = data.categories
    .map(
      (c) =>
        `<li><a href="/products?category=${esc(encodeURIComponent(c.slug))}">${esc(c.name)}</a></li>`,
    )
    .join("");
  const social = [
    { key: "instagram", label: "imPRESSive Juice Bar on Instagram" },
    { key: "facebook", label: "imPRESSive Juice Bar on Facebook" },
  ]
    .map((s) => ({ ...s, href: b?.social_links?.[s.key] }))
    .filter((s) => s.href && /^https?:\/\//i.test(s.href))
    .map(
      (s) =>
        `<li><a href="${esc(s.href)}" rel="noopener me">${esc(s.label)}</a></li>`,
    )
    .join("");
  return `<footer class="bg-brand-brown text-white py-16">
<div class="container grid gap-8 md:grid-cols-3">
<div>
<p class="font-script text-lg text-brand-mustard mb-4">Cold-Pressed Happiness</p>
<p class="text-white/70">${esc(b?.description || "100% cold pressed juice. No added sugar. No dilution. No Preservatives.")}</p>
${social ? `<ul class="mt-4 space-y-1">${social}</ul>` : ""}
</div>
<nav aria-label="Menu">
<h2 class="text-sm font-semibold uppercase tracking-widest mb-4">Menu</h2>
<ul class="space-y-2 text-white/70"><li><a href="/products">All Products</a></li>${categoryLinks}</ul>
</nav>
<div>
<h2 class="text-sm font-semibold uppercase tracking-widest mb-4">Visit Us</h2>
<address class="not-italic text-white/70">${esc(PICKUP_LOCATION_NAME)}<br />${esc(a.line1)}<br />${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}<br /><a href="${esc(telHref(phone))}">${esc(phone)}</a><br /><a href="mailto:${esc(email)}">${esc(email)}</a></address>
<p class="mt-2 text-white/70">${hoursLines(b).map(esc).join("<br />")}</p>
<ul class="mt-4 flex gap-4 text-white/70"><li><a href="/about">About Us</a></li><li><a href="/privacy-policy">Privacy Policy</a></li><li><a href="/terms">Terms of Service</a></li></ul>
</div>
</div>
</footer>`;
}

function layout(data: PrerenderData, main: string): string {
  return `${header()}\n<main>\n${main}\n</main>\n${footer(data)}`;
}

function visitUs(data: PrerenderData): string {
  const b = data.business;
  const a = address(b);
  const full = `${a.line1}, ${a.city}, ${a.state} ${a.zip}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(full)}`;
  return `<section id="locations" class="py-16 bg-card">
<div class="container text-center">
<span class="label-text block mb-3">Visit Us</span>
<h2 class="font-display text-3xl text-brand-brown mb-6">Find Us Locally</h2>
<h3 class="font-display text-2xl font-semibold text-brand-brown mb-4">${esc(PICKUP_LOCATION_NAME)}</h3>
<p class="text-lg text-brand-warm-gray">${esc(a.line1)}<br />${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}</p>
<p class="text-lg text-brand-warm-gray mt-2">${hoursLines(b).map(esc).join("<br />")}</p>
${b?.phone ? `<p class="text-lg text-brand-warm-gray mt-2"><a href="tel:${esc(b.phone)}">${esc(b.phone)}</a></p>` : ""}
<p class="mt-4"><a href="${esc(mapsUrl)}" class="text-brand-berry underline">Open in Google Maps</a></p>
</div>
</section>`;
}

// ---------------------------------------------------------------------------
// Pages

function homeBody(data: PrerenderData): string {
  const juiceBlendCount = data.products.filter((p) =>
    JUICE_CATEGORY_SLUGS.has(p.category?.slug ?? ""),
  ).length;
  const featured = data.featured
    .map(
      (p) => `<li class="py-2"><h3 class="font-display text-xl font-semibold text-brand-brown"><a href="/products/${esc(p.slug)}">${esc(p.name)}</a></h3>${
        p.ingredients || p.short_description
          ? `<p class="text-sm text-brand-warm-gray">${esc(p.ingredients || p.short_description)}</p>`
          : ""
      }</li>`,
    )
    .join("\n");
  return `<section class="py-16">
<div class="container max-w-xl">
<p class="font-script text-2xl text-brand-berry mb-4">${esc(HOME_HERO.tagline)}</p>
<h1 class="font-display text-4xl md:text-5xl font-medium text-brand-brown mb-6">${esc(HOME_HERO.h1Lead)} ${esc(HOME_HERO.h1Place)}</h1>
<p class="text-base text-brand-terracotta font-medium mb-4">${esc(HOME_HERO.subtitle)}</p>
<p class="text-lg text-brand-warm-gray mb-8">${esc(HOME_HERO.description)}</p>
<p class="flex gap-4 mb-8"><a href="/products" class="text-brand-berry underline">Explore Menu</a> <a href="/about" class="text-brand-olive underline">Our Story</a></p>
<ul class="flex gap-12"><li>100% Fresh Produce</li>${juiceBlendCount > 0 ? `<li>${juiceBlendCount} Juice Blends</li>` : ""}</ul>
</div>
</section>
${
  featured
    ? `<section class="py-16 bg-card">
<div class="container">
<span class="label-text block mb-3">Customer Favorites</span>
<h2 class="font-display text-3xl text-brand-brown mb-3">Our Best Sellers</h2>
<p class="font-script text-2xl text-brand-berry mb-6">Pressed to perfection</p>
<ul>
${featured}
</ul>
</div>
</section>`
    : ""
}
${visitUs(data)}`;
}

function productsBody(data: PrerenderData): string {
  const categories = data.categories
    .map(
      (c) =>
        `<li><a href="/products?category=${esc(encodeURIComponent(c.slug))}">${esc(c.name)}</a></li>`,
    )
    .join("");
  const items = data.products
    .map(
      (p) => `<li class="py-3"><h3 class="font-heading font-semibold text-lg text-brand-brown"><a href="/products/${esc(p.slug)}">${esc(p.name)}</a></h3>${
        p.short_description
          ? `<p class="text-sm text-muted-foreground">${esc(p.short_description)}</p>`
          : ""
      }</li>`,
    )
    .join("\n");
  return `<div class="bg-brand-kraft py-12">
<div class="container px-4">
<span class="font-script text-2xl text-brand-terracotta mb-2 block">${esc(PRODUCTS_PAGE.tagline)}</span>
<h1 class="text-4xl md:text-5xl font-heading font-bold text-brand-brown mb-4">${esc(PRODUCTS_PAGE.h1)}</h1>
<p class="text-muted-foreground text-lg max-w-2xl">${esc(PRODUCTS_PAGE.intro)}</p>
</div>
</div>
<div class="container px-4 py-12">
${categories ? `<nav aria-label="Categories" class="mb-8"><ul class="flex flex-wrap gap-4"><li><a href="/products">All</a></li>${categories}</ul></nav>` : ""}
${items ? `<ul>\n${items}\n</ul>` : ""}
</div>`;
}

function aboutBody(data: PrerenderData): string {
  const b = data.business;
  const a = address(b);
  return `<section class="pt-8 pb-16 bg-brand-kraft">
<div class="container px-4 max-w-3xl mx-auto text-center">
<span class="font-script text-3xl text-brand-berry mb-2 block">${esc(ABOUT_PAGE.tagline)}</span>
<h1 class="text-4xl md:text-5xl font-heading font-bold text-brand-brown mb-6">${esc(ABOUT_PAGE.h1)}</h1>
<p class="text-muted-foreground text-lg">${esc(ABOUT_PAGE.lead)}</p>
</div>
</section>
<section class="py-16 bg-card">
<div class="container px-4 max-w-3xl">
<span class="font-script text-2xl text-brand-terracotta mb-2 block">${esc(ABOUT_PAGE.founderLabel)}</span>
<h2 class="text-3xl font-heading font-bold text-brand-brown mb-6">${esc(ABOUT_PAGE.founderHeading)}</h2>
<div class="space-y-4 text-muted-foreground leading-relaxed">
<p class="text-lg font-medium text-brand-olive">${esc(ABOUT_PAGE.founderLead)}</p>
${ABOUT_PAGE.founderStory.map((p) => `<p>${esc(p)}</p>`).join("\n")}
</div>
</div>
</section>
<section class="py-16 bg-brand-kraft/50">
<div class="container px-4 max-w-3xl">
<h2 class="text-3xl font-heading font-bold text-brand-brown text-center mb-8">${esc(ABOUT_PAGE.missionScript)} ${esc(ABOUT_PAGE.missionHeading)}</h2>
<p class="text-lg text-center text-muted-foreground leading-relaxed">${esc(ABOUT_PAGE.mission)}</p>
</div>
</section>
<section class="py-16 bg-card">
<div class="container px-4 max-w-2xl">
<h2 class="font-script text-3xl text-brand-berry mb-2 text-center">Want your juices while on the go?</h2>
<p class="text-center text-muted-foreground mb-8">Our juices are also available locally!</p>
<h3 class="font-semibold text-brand-brown">${esc(PICKUP_LOCATION_NAME)}</h3>
<p class="text-muted-foreground text-sm">${esc(a.line1)}<br />${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}</p>
<h3 class="font-semibold text-brand-brown mt-4">Hours of Operation</h3>
<p class="text-muted-foreground text-sm">${hoursLines(b).map(esc).join("<br />")}</p>
</div>
</section>`;
}

function contactBody(data: PrerenderData): string {
  const b = data.business;
  const a = address(b);
  const email = b?.email || BUSINESS_EMAIL;
  const phone = b?.phone || BUSINESS_PHONE;
  return `<section class="py-16">
<div class="container px-4 text-center">
<h1 class="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">${esc(CONTACT_PAGE.h1)}</h1>
<p class="text-muted-foreground text-lg max-w-2xl mx-auto">${esc(CONTACT_PAGE.lead)}</p>
</div>
</section>
<section class="py-16">
<div class="container px-4">
<h2 class="text-2xl font-display font-bold text-foreground mb-6">Contact Information</h2>
<h3 class="font-semibold mb-1">Email</h3>
<p class="text-muted-foreground mb-4"><a href="mailto:${esc(email)}">${esc(email)}</a></p>
<h3 class="font-semibold mb-1">Phone</h3>
<p class="text-muted-foreground mb-4"><a href="${esc(telHref(phone))}">${esc(phone)}</a></p>
<h3 class="font-semibold mb-1">Location</h3>
<p class="text-muted-foreground mb-4">${esc(a.line1)}<br />${esc(a.city)}, ${esc(a.state)} ${esc(a.zip)}</p>
<h3 class="font-semibold mb-1">Hours</h3>
<div class="text-muted-foreground text-sm space-y-1">${hoursLines(b).map((l) => `<p>${esc(l)}</p>`).join("")}</div>
</div>
</section>`;
}

function legalBody(page: LegalPage): string {
  return `<div class="container mx-auto px-4 py-16 max-w-3xl">
<h1 class="text-3xl font-bold mb-8">${esc(page.h1)}</h1>
<p class="text-muted-foreground mb-4">${esc(page.updated)}</p>
<p class="mb-4">${esc(page.intro)}</p>
${page.sections
  .map(
    (s) =>
      `<section><h2 class="text-xl font-semibold mt-8 mb-4">${esc(s.heading)}</h2><p class="mb-4">${esc(s.body)}</p></section>`,
  )
  .join("\n")}
</div>`;
}

function notFoundBody(): string {
  return `<div class="flex min-h-[60vh] items-center justify-center bg-muted">
<div class="text-center">
<h1 class="mb-4 text-4xl font-bold">${esc(NOT_FOUND_PAGE.h1)}</h1>
<p class="mb-4 text-xl text-muted-foreground">${esc(NOT_FOUND_PAGE.text)}</p>
<a href="/" class="text-primary underline">${esc(NOT_FOUND_PAGE.link)}</a>
</div>
</div>`;
}

/** Sizes the product page uses: its overrides when it has any, else the global table. */
function effectiveSizes(product: PrerenderProduct, globalSizes: PricedSize[]): PricedSize[] {
  return product.variants.length > 0
    ? product.variants.map((v) => ({ name: v.size_name, price: Number(v.price) }))
    : globalSizes;
}

function productBody(product: PrerenderProduct, sizes: PricedSize[]): string {
  const sep = `<span aria-hidden="true"> / </span>`;
  const crumbs = [
    `<li><a href="/">Home</a>${sep}</li>`,
    `<li><a href="/products">Menu</a>${sep}</li>`,
    ...(product.category
      ? [
          `<li><a href="/products?category=${esc(encodeURIComponent(product.category.slug))}">${esc(product.category.name)}</a>${sep}</li>`,
        ]
      : []),
    `<li aria-current="page">${esc(product.name)}</li>`,
  ].join("");
  const options = priceOptions(product, sizes);
  const text = product.description || product.short_description;
  const image = product.image_url
    ? `<img src="${esc(optimizedImageSrc(product.image_url))}" alt="${esc(productImageAlt(product))}" class="w-full max-w-md rounded-3xl object-cover" fetchpriority="high" decoding="async" />`
    : "";
  return `<div class="container px-4 py-8">
<nav aria-label="Breadcrumb" class="mb-6 text-sm text-muted-foreground"><ol class="flex flex-wrap gap-2">${crumbs}</ol></nav>
<div class="grid lg:grid-cols-2 gap-12">
<div>${image}</div>
<div>
${product.category ? `<a href="/products?category=${esc(encodeURIComponent(product.category.slug))}" class="text-brand-terracotta font-medium">${esc(product.category.name)}</a>` : ""}
<h1 class="text-3xl md:text-4xl font-heading font-bold text-brand-brown mt-2 mb-4">${esc(product.name)}</h1>
<p class="text-3xl font-heading font-bold text-brand-berry mb-6">${esc(money(initialPrice(product, sizes)))}</p>
${text ? `<p class="text-muted-foreground text-lg mb-6 leading-relaxed">${esc(text)}</p>` : ""}
${
  options.length
    ? `<h2 class="font-medium text-brand-brown mb-3">${product.slug === "egift-card" ? "Amounts" : "Sizes and options"}</h2>
<ul class="mb-8 text-muted-foreground">${options.map((o) => `<li>${esc(o.label)}: ${esc(money(o.price))}</li>`).join("")}</ul>`
    : ""
}
${
  product.features && product.features.length
    ? `<h2 class="font-heading font-semibold text-lg text-brand-brown mb-3">Benefits</h2>
<ul class="mb-8 space-y-2 text-muted-foreground">${product.features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>`
    : ""
}
${
  product.ingredients
    ? `<h2 class="font-heading font-semibold text-brand-brown">Ingredients</h2>
<p class="text-muted-foreground text-sm leading-relaxed">${esc(product.ingredients)}</p>`
    : ""
}
</div>
</div>
</div>`;
}

// ---------------------------------------------------------------------------
// Routes

function page(
  shell: string,
  data: PrerenderData,
  route: string,
  file: string,
  seo: SeoInput,
  main: string,
  jsonLd?: string,
): PrerenderedPage {
  const html = applyBody(applyHead(shell, seoTags(seo), jsonLd), layout(data, main));
  return { route, file, html };
}

/**
 * Every prerendered file. Static routes always render; product pages and the
 * product lists only when data.products is non-empty.
 */
export function prerenderPages(shell: string, data: PrerenderData): PrerenderedPage[] {
  const pages: PrerenderedPage[] = [
    page(shell, data, "/", "index.html", { ...PAGE_SEO.home, canonicalPath: "/" }, homeBody(data)),
    // /products is also served for /products?category=<slug>, whose live page
    // canonicalizes to itself. A fixed canonical here would contradict that,
    // so this file leaves canonical and og:url to <PageSeo>.
    page(
      shell,
      data,
      "/products",
      "products.html",
      { ...PAGE_SEO.products, canonicalPath: null },
      productsBody(data),
    ),
    page(shell, data, "/about", "about.html", { ...PAGE_SEO.about, canonicalPath: "/about" }, aboutBody(data)),
    page(
      shell,
      data,
      "/contact",
      "contact.html",
      { ...PAGE_SEO.contact, canonicalPath: "/contact" },
      contactBody(data),
    ),
    page(
      shell,
      data,
      "/privacy-policy",
      "privacy-policy.html",
      { ...PAGE_SEO.privacy, canonicalPath: "/privacy-policy" },
      legalBody(PRIVACY_PAGE),
    ),
    page(
      shell,
      data,
      "/terms",
      "terms.html",
      { ...PAGE_SEO.terms, canonicalPath: "/terms" },
      legalBody(TERMS_PAGE),
    ),
    // Served by Vercel with a 404 status for any path nothing else matches.
    // NotFound.tsx uses location.pathname, which has no fixed value here.
    page(shell, data, "(404)", "404.html", { ...PAGE_SEO.notFound, canonicalPath: null }, notFoundBody()),
  ];

  for (const product of data.products) {
    const sizes = effectiveSizes(product, data.globalSizes);
    const prices = offeredPrices(product, sizes);
    const path = `/products/${product.slug}`;
    const canonicalUrl = `${SITE_URL}${path}`;
    const jsonLd = prices.length
      ? jsonLdString(
          productJsonLd({ product, prices, canonicalUrl, imageUrl: product.image_url }),
        )
      : undefined;
    pages.push(
      page(
        shell,
        data,
        path,
        `products/${product.slug}.html`,
        {
          title: productTitle(product),
          description: productDescription(product, prices),
          canonicalPath: path,
          ogImage: product.image_url || undefined,
          type: "product",
          noindex: !product.is_available,
        },
        productBody(product, sizes),
        jsonLd,
      ),
    );
  }
  return pages;
}
