import { Layout } from "@/components/layout/Layout";
import { PageSeo } from "@/components/PageSeo";

export default function Terms() {
  return (
    <Layout>
      <PageSeo
        title="Terms of Service"
        description="The terms that apply when you use the imPRESSive Juice Bar website and place orders for pickup in Portsmouth, VA."
      />
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-4">Last updated: April 2026</p>
        <p className="mb-4">
          By using the imPRESSive Juice Bar website, you agree to these Terms of Service.
          Please read them carefully.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">Orders and Payment</h2>
        <p className="mb-4">
          All orders are subject to availability. Payment is processed securely through Square.
          We reserve the right to cancel orders at our discretion.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">Pickup</h2>
        <p className="mb-4">
          Online orders are for in-store pickup. Available pickup dates and times are shown at
          checkout and may change during store closures or holidays. See our Contact page for
          current hours.
        </p>
        <h2 className="text-xl font-semibold mt-8 mb-4">Contact Us</h2>
        <p>For questions about these terms, contact us at the email or address on our Contact page.</p>
      </div>
    </Layout>
  );
}
