import { Layout } from "@/components/layout/Layout";
import { PageSeo } from "@/components/PageSeo";
import { PAGE_SEO } from "@/config/page-content";
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
        title={PAGE_SEO.home.title}
        description={PAGE_SEO.home.description}
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
