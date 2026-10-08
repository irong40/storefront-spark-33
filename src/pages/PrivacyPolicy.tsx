import { Layout } from "@/components/layout/Layout";
import { PageSeo } from "@/components/PageSeo";
import { LegalContent } from "@/components/LegalContent";
import { PAGE_SEO, PRIVACY_PAGE } from "@/config/page-content";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <PageSeo
        title={PAGE_SEO.privacy.title}
        description={PAGE_SEO.privacy.description}
      />
      <LegalContent page={PRIVACY_PAGE} />
    </Layout>
  );
}
