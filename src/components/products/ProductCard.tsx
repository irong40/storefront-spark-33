import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import type { Product } from '@/hooks/use-products';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const isSoldOut = product.stock_quantity === 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 5;

  return (
    <Card className={cn(
      "group overflow-hidden border-2 border-brand-terracotta/10 hover:border-brand-berry/30 hover:shadow-lg transition-all duration-300 bg-card h-full flex flex-col",
      isSoldOut && "opacity-75 grayscale-[0.5] hover:opacity-100 transition-opacity"
    )}>
      <Link to={`/products/${product.slug}`} className="block relative">
        <div className="aspect-square overflow-hidden bg-brand-kraft relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className={cn(
                "h-full w-full object-cover transition-transform duration-500",
                !isSoldOut && "group-hover:scale-105"
              )}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-6xl bg-gradient-to-br from-brand-olive/10 via-brand-kraft to-brand-mustard/10">
              🧃
            </div>
          )}

          {/* Badges Container */}
          <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
            {isSoldOut ? (
              <Badge className="bg-slate-800 text-white border-0 font-medium shadow-md uppercase tracking-wider text-xs">
                Sold Out
              </Badge>
            ) : (
              <>
                {product.is_bestseller && (
                  <Badge className="bg-brand-mustard text-brand-brown border-0 font-medium shadow-md">
                    ✨ Best Seller
                  </Badge>
                )}
                {product.is_new && (
                  <Badge className="bg-brand-olive text-white border-0 font-medium shadow-md">
                    New Arrival
                  </Badge>
                )}
              </>
            )}
          </div>

          {(hasDiscount && !isSoldOut) && (
            <Badge className="absolute top-3 right-3 bg-brand-berry text-white border-0 font-medium shadow-md">
              Sale
            </Badge>
          )}

          {isLowStock && !isSoldOut && (
            <Badge className="absolute bottom-3 left-3 bg-orange-100 text-orange-800 border-orange-200 border shadow-sm">
              Only {product.stock_quantity} left!
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4 flex flex-col flex-1">
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

        <div className="mt-auto pt-2 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-muted-foreground">
              {isSoldOut ? 'Unavailable' : 'Select Size'}
            </span>
            {hasDiscount && !isSoldOut && (
              <span className="text-xs text-brand-berry font-medium line-through">
                Sale
              </span>
            )}
          </div>
          <AddToCartButton
            productId={product.id}
            size="sm"
            disabled={isSoldOut}
          />
        </div>
      </CardContent>
    </Card>
  );
}
