import { Layout } from '@/components/layout/Layout';
import { Hero } from '@/components/home/Hero';
import { AnnouncementBanner } from '@/components/home/AnnouncementBanner';
import { BenefitsBar } from '@/components/home/BenefitsBar';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Story } from '@/components/home/Story';
import { MenuPreview } from '@/components/home/MenuPreview';
import { Testimonials } from '@/components/home/Testimonials';
import { Newsletter } from '@/components/home/Newsletter';
import { Locations } from '@/components/home/Locations';

export default function Home() {
  return (
    <Layout>
      <AnnouncementBanner />
      <Hero />
      <BenefitsBar />
      <FeaturedProducts />
      <Story />
      <MenuPreview />
      <Testimonials />
      <Newsletter />
      <Locations />
    </Layout>
  );
}
