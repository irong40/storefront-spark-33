import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { Product } from "@/hooks/use-products";
import { ProductImage } from "@/components/ui/ProductImage";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount =
    product.compare_at_price && product.compare_at_price > product.price;

  return (
    <Card className="group overflow-hidden border-2 border-brand-terracotta/10 hover:border-brand-berry/30 hover:shadow-lg transition-all duration-300 bg-card">
      <Link to={`/products/${product.slug}`}>
        <div className="aspect-square overflow-hidden bg-brand-kraft relative">
          {product.image_url ? (
            <ProductImage
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-6xl bg-gradient-to-br from-brand-olive/10 via-brand-kraft to-brand-mustard/10">
              🧃
            </div>
          )}
          {product.is_featured && (
            <Badge className="absolute top-3 left-3 bg-brand-mustard text-brand-brown border-0 font-medium shadow-md">
              ✨ Best Seller
            </Badge>
          )}
          {hasDiscount && (
            <Badge className="absolute top-3 right-3 bg-brand-berry text-white border-0 font-medium shadow-md">
              Sale
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <Link to={`/products/${product.slug}`}>
          <h3 className="font-heading font-semibold text-lg text-brand-brown mb-1 group-hover:text-brand-berry transition-colors">
            {product.name}
          </h3>
        </Link>
        {product.short_description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {product.short_description}
          </p>
        )}
        <div className="flex items-center justify-between">
          {hasDiscount && (
            <span className="text-sm text-muted-foreground line-through ml-2">
              Sale
            </span>
          )}
          <AddToCartButton productId={product.id} size="sm" />
        </div>
      </CardContent>
    </Card>
  );
}
