// Per-page SEO tag values, shared by <PageSeo> (in the browser) and
// scripts/prerender.js (at build time) so the two cannot drift apart.

import { FULFILLMENT_SNIPPET } from "@/config/business";
import { SITE_URL, absoluteUrl } from "@/lib/product-seo";

export const SITE_NAME = "imPRESSive Juice Bar";
export const DEFAULT_DESCRIPTION = `Fresh cold-pressed juices, wellness shots, and detox packages from imPRESSive Juice Bar in Portsmouth, VA. ${FULFILLMENT_SNIPPET}`;
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

export interface SeoInput {
  title: string;
  description?: string;
  /** Path for the canonical and og:url. null leaves both out. */
  canonicalPath: string | null;
  ogImage?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
}

export interface SeoTags {
  title: string;
  description: string;
  canonical: string | null;
  image: string;
  type: string;
  noindex: boolean;
}

/**
 * Titles that already carry the brand ("| imPRESSive Portsmouth") keep their
 * own form so they stay near 60 characters.
 */
export function fullTitle(title: string): string {
  return title.includes("imPRESSive") ? title : `${title} | ${SITE_NAME}`;
}

export function seoTags({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  ogImage = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
}: SeoInput): SeoTags {
  return {
    title: fullTitle(title),
    description,
    canonical: canonicalPath === null ? null : `${SITE_URL}${canonicalPath}`,
    // Social scrapers need absolute image URLs; DB rows can hold "/products/x.png".
    image: absoluteUrl(ogImage),
    type,
    noindex,
  };
}
