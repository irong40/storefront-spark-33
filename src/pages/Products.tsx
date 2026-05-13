import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { CategoryFilter } from "@/components/products/CategoryFilter";
import { useProducts } from "@/hooks/use-products";
import { PageSeo } from "@/components/PageSeo";

const CATEGORY_SEO: Record<string, { title: string; description: string }> = {
  "cold-pressed-juices": {
    title: "Cold-Pressed Juices",
    description:
      "Fresh-pressed fruit and vegetable juices made daily at imPRESSive Juice Bar in Portsmouth, VA. No added sugar, no preservatives. Pickup or delivery.",
  },
  "wellness-shots": {
    title: "Wellness Shots — Beet, Ginger, Turmeric, Kale",
    description:
      "Single-serve wellness shots from imPRESSive Juice Bar in Portsmouth, VA. $4 each. Pickup Tue-Sat or delivery across Hampton Roads.",
  },
  "detox-packages": {
    title: "1-Day & 3-Day Juice Detox Packages",
    description:
      "Reset with a cold-pressed juice detox from imPRESSive Juice Bar in Portsmouth, VA. 1-day and 3-day packages. Pickup or Hampton Roads delivery.",
  },
  "energy-immunity-booster": {
    title: "Energy & Immunity Booster Juices",
    description:
      "Energy and immunity-focused cold-pressed juices in Portsmouth, VA. Made fresh at imPRESSive Juice Bar. Pickup or Hampton Roads delivery.",
  },
  "detox-fat-burners": {
    title: "Detox & Fat-Burner Juices",
    description:
      "Detox and fat-burner cold-pressed juices in Portsmouth, VA. Fresh, no added sugar. Pickup or delivery across Hampton Roads.",
  },
  "sweet-treats": {
    title: "Sweet Treat Juices & Smoothies",
    description:
      "Crowd-pleaser cold-pressed juices and smoothies in Portsmouth, VA. Pickup Tue-Sat or delivery across Hampton Roads.",
  },
  subscriptions: {
    title: "Juice Subscriptions",
    description:
      "Weekly cold-pressed juice and wellness-shot subscriptions in Portsmouth, VA. Pickup or Hampton Roads delivery.",
  },
  food: {
    title: "Salads, Parfaits & Muffins",
    description:
      "Light food options from imPRESSive Juice Bar in Portsmouth, VA. Salads, parfaits, muffins. Pickup or Hampton Roads delivery.",
  },
};

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get("category");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    categoryParam,
  );

  const { data, isLoading } = useProducts(selectedCategory || undefined);
  const products = data?.products;

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  const handleCategoryChange = (slug: string | null) => {
    setSelectedCategory(slug);
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  const seo =
    (categoryParam && CATEGORY_SEO[categoryParam]) || {
      title: "All Juices, Wellness Shots & Smoothies",
      description:
        "Browse the full menu at imPRESSive Juice Bar in Portsmouth, VA. Cold-pressed juices, wellness shots, smoothies, salads. Pickup or Hampton Roads delivery.",
    };

  return (
    <Layout>
      <PageSeo
        title={seo.title}
        description={seo.description}
        canonicalPath="/products"
      />
      {/* Hero Section */}
      <div className="bg-brand-kraft relative overflow-hidden py-12">
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-berry/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-mustard/15 rounded-full blur-3xl" />
        </div>

        <div className="container px-4 relative z-10">
          <span className="font-script text-2xl text-brand-terracotta mb-2 block">
            Fresh & Natural
          </span>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-brand-brown mb-4">
            Fresh Cold-Pressed Juices, Wellness Shots &amp; Cleanses
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Fresh cold-pressed juices made daily. Choose from our selection of
            juices, wellness shots, and cleanse programs.
          </p>
        </div>
      </div>

      <div className="container px-4 py-12">
        <div className="mb-8">
          <CategoryFilter
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
        </div>

        <ProductGrid products={products || []} isLoading={isLoading} />

        {!isLoading && products?.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍃</div>
            <p className="text-muted-foreground text-lg">
              No products found in this category.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
