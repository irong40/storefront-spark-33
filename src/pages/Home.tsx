import { Layout } from "@/components/layout/Layout";
import { PageSeo } from "@/components/PageSeo";
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
        description="Fresh cold-pressed juice, wellness shots, and smoothies in Portsmouth, VA. Pickup Tue-Sat at 719 High St. Delivery across Hampton Roads."
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
