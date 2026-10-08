import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import { seoTags } from "@/lib/seo-meta";

interface PageSeoProps {
  title: string;
  description?: string;
  /** Override the canonical path. Defaults to the current location.pathname. */
  canonicalPath?: string;
  ogImage?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
}

/**
 * Renders all per-page SEO tags: <title>, meta description, canonical link,
 * Open Graph + Twitter Card tags. Drop in once per page near the top of the
 * page component. App.tsx already wires <HelmetProvider />.
 *
 * The tag values come from seoTags() in src/lib/seo-meta.ts, which the
 * build-time prerender (scripts/prerender.js) also uses.
 */
export function PageSeo({
  title,
  description,
  canonicalPath,
  ogImage,
  type,
  noindex,
}: PageSeoProps) {
  const location = useLocation();
  const tags = seoTags({
    title,
    description,
    canonicalPath: canonicalPath ?? location.pathname,
    ogImage,
    type,
    noindex,
  });
  const canonical = tags.canonical as string;

  return (
    <Helmet>
      <title>{tags.title}</title>
      <meta name="description" content={tags.description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={tags.title} />
      <meta property="og:description" content={tags.description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={tags.image} />
      <meta property="og:type" content={tags.type} />
      <meta name="twitter:title" content={tags.title} />
      <meta name="twitter:description" content={tags.description} />
      <meta name="twitter:image" content={tags.image} />
      {tags.noindex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
