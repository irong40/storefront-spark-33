import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { ProductGrid } from "@/components/products/ProductGrid";
import { CategoryFilter } from "@/components/products/CategoryFilter";
import { useProducts } from "@/hooks/use-products";
import { PageSeo } from "@/components/PageSeo";
import { CATEGORY_SEO } from "@/config/category-seo";

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

  // A known category is its own page: own title, H1, intro and a canonical
  // that points at itself. Anything else canonicalizes to /products.
  const categorySeo = categoryParam ? CATEGORY_SEO[categoryParam] : undefined;
  const seo = categorySeo ?? {
    title: "Juice Bar Menu, Portsmouth VA | imPRESSive Juice Bar",
    description:
      "Full menu: cold-pressed juices, $4 wellness shots, juice cleanse packages, salads and parfaits. Pressed fresh in Portsmouth, VA. Order ahead for pickup.",
  };
  const canonicalPath = categorySeo
    ? `/products?category=${categoryParam}`
    : "/products";

  return (
    <Layout>
      <PageSeo
        title={seo.title}
        description={seo.description}
        canonicalPath={canonicalPath}
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
            {categorySeo?.h1 ??
              "Fresh Cold-Pressed Juices, Wellness Shots & Cleanses"}
          </h1>
          {categorySeo ? (
            <div className="text-muted-foreground text-base md:text-lg max-w-3xl space-y-3">
              {categorySeo.intro.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-lg max-w-2xl">
              Fresh cold-pressed juices made daily. Choose from our selection of
              juices, wellness shots, and cleanse programs.
            </p>
          )}
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
