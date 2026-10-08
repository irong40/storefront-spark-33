import { Layout } from "@/components/layout/Layout";
import { PageSeo } from "@/components/PageSeo";
import { HOURS_SUMMARY } from "@/config/business";
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
        title="Cold-Pressed Juice in Portsmouth, VA | imPRESSive Juice Bar"
        description={`Cold-pressed juice, $4 wellness shots and juice cleanses at 719 High St, Portsmouth, VA. Order online for pickup, ${HOURS_SUMMARY}.`}
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
