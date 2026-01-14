import { Layout } from '@/components/layout/Layout';
import { Hero } from '@/components/home/Hero';
import { AnnouncementBanner } from '@/components/home/AnnouncementBanner';
import { BenefitsBar } from '@/components/home/BenefitsBar';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Testimonials } from '@/components/home/Testimonials';
import { Locations } from '@/components/home/Locations';

export default function Home() {
  return (
    <Layout>
      <AnnouncementBanner />
      <Hero />
      <BenefitsBar />
      <FeaturedProducts />
      <Testimonials />
      <Locations />
    </Layout>
  );
}
