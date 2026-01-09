import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ProductGrid } from '@/components/products/ProductGrid';
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { useProducts } from '@/hooks/use-products';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  
  const { data: products, isLoading } = useProducts(selectedCategory || undefined);

  useEffect(() => {
    if (categoryParam !== selectedCategory) {
      setSelectedCategory(categoryParam);
    }
  }, [categoryParam]);

  const handleCategoryChange = (slug: string | null) => {
    setSelectedCategory(slug);
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
  };

  return (
    <Layout>
      <div className="bg-secondary/30 py-12">
        <div className="container px-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground mb-4">
            Our Products
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Fresh, organic cold-pressed juices made daily. Choose from our selection of juices, 
            wellness shots, and cleanse programs.
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
            <p className="text-muted-foreground text-lg">
              No products found in this category.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
