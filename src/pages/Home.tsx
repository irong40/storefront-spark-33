import { Layout } from '@/components/layout/Layout';
import { Hero } from '@/components/home/Hero';
import { FeaturedProducts } from '@/components/home/FeaturedProducts';
import { Categories } from '@/components/home/Categories';
import { Story } from '@/components/home/Story';
import { CTA } from '@/components/home/CTA';

export default function Home() {
  return (
    <Layout>
      <Hero />
      <FeaturedProducts />
      <Categories />
      <Story />
      <CTA />
    </Layout>
  );
}
