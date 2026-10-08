import { Layout } from "@/components/layout/Layout";
import { PageSeo } from "@/components/PageSeo";

export default function PrivacyPolicy() {
  return (
    <Layout>
      <PageSeo
        title="Privacy Policy"
        description="How imPRESSive Juice Bar collects, uses and protects the information you share when you order online or contact us."
      />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">Last updated: April 2026</p>
        <p className="mb-4">
          imPRESSive Juice Bar ("we", "us", or "our") is committed to protecting your privacy.
          This policy describes how we collect and use your information when you use our website
          or place an order.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">Information We Collect</h2>
        <p className="mb-4">
          We collect information you provide directly, including name, email address, delivery
          address, and payment information (processed securely by Square — we never store card numbers).
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
        <p>For privacy questions, contact us at the email or address on our Contact page.</p>
      </div>
    </Layout>
  );
}
