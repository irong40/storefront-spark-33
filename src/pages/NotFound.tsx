import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { logger } from "@/lib/logger";
import { Layout } from "@/components/layout/Layout";
import { PageSeo } from "@/components/PageSeo";
import { NOT_FOUND_PAGE, PAGE_SEO } from "@/config/page-content";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <Layout>
      <PageSeo title={PAGE_SEO.notFound.title} noindex />
      <div className="flex min-h-[60vh] items-center justify-center bg-muted">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">{NOT_FOUND_PAGE.h1}</h1>
          <p className="mb-4 text-xl text-muted-foreground">
            {NOT_FOUND_PAGE.text}
          </p>
          <a href="/" className="text-primary underline hover:text-primary/90">
            {NOT_FOUND_PAGE.link}
          </a>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
