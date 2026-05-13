import { useEffect } from "react";

const SITE_NAME = "imPRESSive Juice Bar";

/**
 * Sets document.title only. For full per-page SEO (description, canonical,
 * og tags), use the <PageSeo /> component from "@/components/PageSeo".
 */
export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    if (!pageTitle) {
      document.title = SITE_NAME;
    } else if (pageTitle.includes(SITE_NAME)) {
      document.title = pageTitle;
    } else {
      document.title = `${pageTitle} | ${SITE_NAME}`;
    }
  }, [pageTitle]);
}
