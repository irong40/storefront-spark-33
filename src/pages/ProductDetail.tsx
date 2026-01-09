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
          <h1 className="text-2xl font-heading font-bold text-brand-brown mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button asChild className="bg-brand-berry hover:bg-brand-berry/90">
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
        <Button variant="ghost" asChild className="mb-6 text-brand-olive hover:text-brand-berry hover:bg-brand-olive/10">
          <Link to="/products">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Link>
        </Button>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-brand-kraft border-2 border-brand-terracotta/20 shadow-lg flex items-center justify-center overflow-hidden">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-8xl bg-gradient-to-br from-brand-olive/10 via-brand-kraft to-brand-mustard/10 w-full h-full flex items-center justify-center">
                  🍹
                </div>
              )}
            </div>
            {product.is_featured && (
              <Badge className="absolute top-4 left-4 bg-brand-mustard text-brand-brown border-0 font-medium shadow-lg">
                ✨ Best Seller
              </Badge>
            )}
            {hasDiscount && (
              <Badge className="absolute top-4 right-4 bg-brand-berry text-white border-0 font-medium shadow-lg">
                Sale
              </Badge>
            )}
            {/* Decorative elements */}
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-brand-berry/15 rounded-full blur-xl -z-10" />
            <div className="absolute -top-4 -left-4 w-20 h-20 bg-brand-mustard/15 rounded-full blur-xl -z-10" />
          </div>

          {/* Product Info */}
          <div>
            {product.category && (
              <Link 
                to={`/products?category=${product.category.slug}`}
                className="inline-block text-brand-terracotta font-medium hover:text-brand-berry transition-colors"
              >
                {product.category.name}
              </Link>
            )}
            
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-brand-brown mt-2 mb-4">
              {product.name}
            </h1>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-heading font-bold text-brand-berry">
                ${Number(product.price).toFixed(2)}
              </span>
              {hasDiscount && (
                <span className="text-xl text-muted-foreground line-through">
                  ${Number(product.compare_at_price).toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-muted-foreground text-lg mb-6 leading-relaxed">
              {product.description || product.short_description}
            </p>

            {/* Quantity Selector */}
            <div className="flex items-center gap-4 mb-6">
              <span className="font-medium text-brand-brown">Quantity:</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="border-brand-terracotta/30 text-brand-olive hover:bg-brand-olive hover:text-white hover:border-brand-olive"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-12 text-center font-heading font-medium text-brand-brown">{quantity}</span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                  className="border-brand-terracotta/30 text-brand-olive hover:bg-brand-olive hover:text-white hover:border-brand-olive"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <AddToCartButton 
              productId={product.id} 
              quantity={quantity}
              className="w-full md:w-auto mb-8 bg-brand-berry hover:bg-brand-berry/90 shadow-lg"
              size="lg"
            />

            {/* Features */}
            {product.features && product.features.length > 0 && (
              <div className="mb-8">
                <h3 className="font-heading font-semibold text-lg text-brand-brown mb-3">Benefits</h3>
                <ul className="space-y-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-brand-olive/10 text-brand-olive flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ingredients */}
            {product.ingredients && (
              <div className="p-5 rounded-2xl bg-brand-kraft/50 border-2 border-brand-olive/20">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-brand-olive/10 text-brand-olive flex items-center justify-center">
                    <Leaf className="h-4 w-4" />
                  </div>
                  <h3 className="font-heading font-semibold text-brand-brown">Ingredients</h3>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
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
