import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useProduct } from '@/hooks/use-products';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, Minus, Plus, Check, Leaf } from 'lucide-react';

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug || '');
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <Layout>
        <div className="container px-4 py-12">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid lg:grid-cols-2 gap-12">
            <Skeleton className="aspect-square rounded-2xl" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-48" />
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !product) {
    return (
      <Layout>
        <div className="container px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild>
            <Link to="/products">Back to Products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;

  return (
    <Layout>
      <div className="container px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/products">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/10 via-secondary to-accent/10 flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-8xl">🍹</div>
              )}
            </div>
            {product.is_featured && (
              <Badge className="absolute top-4 left-4 bg-accent text-accent-foreground">
                Best Seller
              </Badge>
            )}
            {hasDiscount && (
              <Badge className="absolute top-4 right-4 bg-destructive text-destructive-foreground">
                Sale
              </Badge>
            )}
          </div>

          {/* Product Info */}
          <div>
            {product.category && (
              <Link 
                to={`/products?category=${product.category.slug}`}
                className="text-primary font-medium hover:underline"
              >
                {product.category.name}
              </Link>
            )}
            
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-2 mb-4">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-bold text-primary">
                ${Number(product.price).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xl text-muted-foreground line-through">
                  ${Number(product.compare_at_price).toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-muted-foreground text-lg mb-6">
              {product.description || product.short_description}
            </p>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="font-medium">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <AddToCartButton 
              productId={product.id} 
              quantity={quantity}
              className="w-full md:w-auto mb-8"
              size="lg"
            />

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-lg mb-3">Benefits</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ingredients */}
            {product.ingredients && (
              <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Leaf className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Ingredients</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  {product.ingredients}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
