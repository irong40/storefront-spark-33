import { useEffect, useState } from "react";
import { useFeaturedProducts } from "@/hooks/use-products";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductImage } from "@/components/ui/ProductImage";

const CYCLE_MS = 15000;
const SLIDE_MS = 500;

export function FeaturedProducts() {
  const { data: products, isLoading } = useFeaturedProducts();

  const [startIndex, setStartIndex] = useState(0);
  const [sliding, setSliding] = useState(false);

  useEffect(() => {
    if (!products?.length || products.length <= 3) return;
    const timer = setInterval(() => {
      setSliding(true);
      setTimeout(() => {
        setStartIndex((prev) => (prev + 1) % products.length);
        setSliding(false);
      }, SLIDE_MS);
    }, CYCLE_MS);
    return () => clearInterval(timer);
  }, [products]);

  // 4 items in the strip: 3 visible + 1 sliding in from the right
  const stripCount = products && products.length > 3 ? 4 : 3;
  const displayedProducts = products
    ? Array.from({ length: stripCount }, (_, i) =>
        products[(startIndex + i) % products.length],
      )
    : [];

  return (
    <section className="py-24 bg-card relative">
      {/* Gradient overlay from background */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-background to-transparent pointer-events-none" />

      <div className="container relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="label-text block mb-3">Customer Favorites</span>
          <h2 className="font-display text-3xl md:text-4xl font-medium text-brand-brown mb-3">
            Our Best Sellers
          </h2>
          <p className="font-script text-2xl text-brand-berry">
            Pressed to perfection
          </p>
        </div>

        {/* Products carousel */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-background rounded-3xl p-6">
                <Skeleton className="w-28 h-36 mx-auto mb-4 rounded-2xl" />
                <Skeleton className="h-6 w-3/4 mx-auto mb-2" />
                <Skeleton className="h-4 w-full mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden">
            <div
              className="flex"
              style={{
                transform: sliding ? "translateX(-33.333%)" : "translateX(0)",
                transition: sliding ? `transform ${SLIDE_MS}ms cubic-bezier(0.4,0,0.2,1)` : "none",
              }}
            >
            {displayedProducts.map((product, slotIndex) => {
              const imageSrc = product.image_url ?? null;
              return (
                <div
                  key={`${startIndex}-${slotIndex}`}
                  className="w-1/3 shrink-0 px-3"
                >
                  <div className="group bg-background rounded-3xl p-6 text-center transition-all duration-300 hover:-translate-y-2 hover:shadow-lifted relative overflow-hidden flex flex-col h-full">
                    {/* Top gradient border on hover */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-berry to-brand-mustard transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />

                    {/* Image */}
                    <Link to={`/products/${product.slug}`} className="block mb-4">
                      <div className="relative w-full aspect-[4/5] mx-auto bg-gradient-to-br from-brand-cream-dark to-brand-terracotta/20 rounded-2xl overflow-hidden flex items-center justify-center">
                        {imageSrc ? (
                          <ProductImage
                            src={imageSrc}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            priority={slotIndex === 0}
                          />
                        ) : (
                          <span className="text-6xl">{"🧃"}</span>
                        )}

                        {slotIndex === 0 && (
                          <span className="absolute top-3 right-3 bg-brand-berry text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                            Popular
                          </span>
                        )}
                        {slotIndex === 2 && (
                          <span className="absolute top-3 right-3 bg-brand-olive text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider shadow-sm z-10">
                            New
                          </span>
                        )}
                      </div>
                    </Link>

                    {/* Product info */}
                    <div className="flex-1 flex flex-col">
                      <Link to={`/products/${product.slug}`}>
                        <h3 className="font-display text-xl font-semibold text-brand-brown mb-1 group-hover:text-brand-berry transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm text-brand-warm-gray mb-4 line-clamp-2">
                        {product.ingredients || product.short_description}
                      </p>

                      <div className="mt-auto flex items-center justify-end">
                        <Button
                          asChild
                          size="sm"
                          className="rounded-full bg-brand-berry hover:bg-brand-berry-dark hover:scale-105 transition-all shadow-sm px-4"
                        >
                          <Link to={`/products/${product.slug}`}>
                            Choose Size
                            <ArrowRight className="ml-1 h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* View All CTA */}
        <div className="text-center mt-12">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8 border-2 border-brand-olive text-brand-olive hover:bg-brand-olive hover:text-white font-semibold"
          >
            <Link to="/products">
              View Full Menu
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
