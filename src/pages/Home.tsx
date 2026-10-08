import { Layout } from "@/components/layout/Layout";
import { PageSeo } from "@/components/PageSeo";
import { FULFILLMENT_SNIPPET } from "@/config/business";
import { Hero } from "@/components/home/Hero";
import { AnnouncementBanner } from "@/components/home/AnnouncementBanner";
import { BenefitsBar } from "@/components/home/BenefitsBar";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { Testimonials } from "@/components/home/Testimonials";
import { Locations } from "@/components/home/Locations";

export default function Home() {
  return (
    <Layout>
      <PageSeo
        title="imPRESSive Juice Bar | Cold-Pressed Juice Bar in Portsmouth, VA"
        description={`Fresh cold-pressed juice and wellness shots in Portsmouth, VA. ${FULFILLMENT_SNIPPET}`}
      />
      <AnnouncementBanner />
      <Hero />
      <BenefitsBar />
      <FeaturedProducts />
      <Testimonials />
      <Locations />
    </Layout>
  );
}
