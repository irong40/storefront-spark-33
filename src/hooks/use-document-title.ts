import { useEffect } from "react";

const SITE_NAME = "imPRESSive Juice Bar";

export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | ${SITE_NAME}` : SITE_NAME;
  }, [pageTitle]);
}
