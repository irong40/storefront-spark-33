import { Layout } from "@/components/layout/Layout";
import { PageSeo } from "@/components/PageSeo";
import { LegalContent } from "@/components/LegalContent";
import { PAGE_SEO, TERMS_PAGE } from "@/config/page-content";

export default function Terms() {
  return (
    <Layout>
      <PageSeo
        title={PAGE_SEO.terms.title}
        description={PAGE_SEO.terms.description}
      />
      <LegalContent page={TERMS_PAGE} />
    </Layout>
  );
}
