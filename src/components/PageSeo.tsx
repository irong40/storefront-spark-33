import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

const SITE_NAME = "imPRESSive Juice Bar";
const SITE_URL = "https://www.impressivejb.com";
const DEFAULT_DESCRIPTION =
  "Fresh cold-pressed juices, wellness shots, and detox packages from imPRESSive Juice Bar in Portsmouth, VA. Pickup Tue-Sat. Delivery across Hampton Roads.";
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.jpg`;

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
 */
export function PageSeo({
  title,
  description = DEFAULT_DESCRIPTION,
  canonicalPath,
  ogImage = DEFAULT_OG_IMAGE,
  type = "website",
  noindex,
}: PageSeoProps) {
  const location = useLocation();
  const fullTitle = title.includes(SITE_NAME)
    ? title
    : `${title} | ${SITE_NAME}`;
  const canonical = `${SITE_URL}${canonicalPath ?? location.pathname}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={type} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
}
