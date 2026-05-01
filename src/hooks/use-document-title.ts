import { useEffect } from "react";

const SITE_NAME = "imPRESSive Juice Bar";

export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    if (!pageTitle) {
      document.title = SITE_NAME;
    } else if (pageTitle.includes(SITE_NAME)) {
      // Full title already provided — use as-is
      document.title = pageTitle;
    } else {
      document.title = `${pageTitle} | ${SITE_NAME}`;
    }
  }, [pageTitle]);
}
