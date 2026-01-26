import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/layout/Layout';
import { useProduct, Product, useAddons } from '@/hooks/use-products';
import { AddToCartButton } from '@/components/cart/AddToCartButton';
import { Button } from '@/components/ui/button';
import { FlavorSelector } from '@/components/products/FlavorSelector';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Minus, Plus, Check, Leaf } from 'lucide-react';
import { ReviewList } from '@/components/reviews/ReviewList';

export default function ProductDetail() {
  // Fetch global sizes for mapping
  const [globalSizes, setGlobalSizes] = useState<{ id: string, name: string, price: number }[]>([]);
  useEffect(() => {
    async function fetchSizes() {
      const { data } = await supabase.from('product_sizes').select('*').eq('active', true).order('sort_order');
      if (data) setGlobalSizes(data.map(s => ({ ...s, price: Number(s.price) })));
    }
    fetchSizes();
  }, []);

  // Flavor Selection Configuration
  const getFlavorSelectionLimit = (slug: string) => {
    switch (slug) {
      case 'sample-box': return 4;
      case '3-pack-subscription': return 3;
      case 'wellness-shot': return 1;
      case 'gallon-subscription': return 1;
      case 'half-gallon-subscription': return 1;
      default: return 0;
    }
  };

  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug || '');
  const { data: addons } = useAddons(); // Fetch addons

  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedSizeId, setSelectedSizeId] = useState<string | null>(null);
  const [selectedFlavors, setSelectedFlavors] = useState<Product[]>([]);
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>([]); // Addon state

  const flavorLimit = product ? getFlavorSelectionLimit(product.slug) : 0;
  const requiresFlavors = flavorLimit > 0;

  // Gift Card Form State
  const [giftCardForm, setGiftCardForm] = useState({
    recipientEmail: '',
    recipientName: '',
    message: '',
    deliveryDate: ''
  });

  // Default selections
  useEffect(() => {
    if (product?.variants && product.variants.length > 0 && !selectedVariantId) {
      setSelectedVariantId(product.variants[0].id);
    }
    // Default to 16 oz if available and not using variants
    if (!product?.variants?.length && globalSizes.length > 0 && !selectedSizeId && !requiresFlavors) {
      const defaultSize = globalSizes.find(s => s.name === '16 oz') || globalSizes[0];
      if (defaultSize) setSelectedSizeId(defaultSize.id);
    }
  }, [product, globalSizes, selectedVariantId, selectedSizeId, requiresFlavors]);

  // Derived state
  const selectedVariant = product?.variants?.find(v => v.id === selectedVariantId);
  const selectedSize = globalSizes.find(s => s.id === selectedSizeId);

  const toggleAddon = (addonId: string) => {
    setSelectedAddonIds(prev =>
      prev.includes(addonId)
        ? prev.filter(id => id !== addonId)
        : [...prev, addonId]
    );
  };

  // Price Calculation
  let currentPrice = 0;
  if (selectedVariant) {
    currentPrice = Number(selectedVariant.price);
  } else if (!product?.variants?.length && product?.slug !== 'egift-card' && selectedSize) {
    currentPrice = selectedSize.price;
  } else {
    currentPrice = Number(product?.price || 0);
  }

  // Add Add-ons cost
  const addonsCost = selectedAddonIds.reduce((sum, id) => {
    const addon = addons?.find(a => a.id === id);
    return sum + Number(addon?.price || 0);
  }, 0);
  currentPrice += addonsCost;

  // Validation for Add to Cart
  const isAddToCartDisabled = () => {
    if (product?.slug === 'egift-card' && !giftCardForm.recipientEmail) return true;
    if (requiresFlavors && selectedFlavors.length !== flavorLimit) return true;
    return false;
  };

  // Gift Card Image Logic
  const getGiftCardImage = (amount: number) => {
    const images: Record<number, string> = {
      25: "/images/products/gift-card-25.jpg",
      50: "/images/products/gift-card-50.jpg",
      100: "/images/products/gift-card-100.jpg",
      150: "/images/products/gift-card-150.jpg",
      200: "/images/products/gift-card-200.jpg"
    };
    return images[amount] || product?.image_url;
  };

  const displayImage = (product?.slug === 'egift-card' && selectedVariant)
    ? getGiftCardImage(currentPrice) // Note: currentPrice includes addons but gift cards don't have addons
    : (product?.image_url || null);

  // Determine if we should show addons (Standard Juices only)
  // Logic: Not requiring flavors (bundles), not gift card, has category, category is one of the juice types
  const showAddons = !requiresFlavors && product?.slug !== 'egift-card' &&
    product?.category?.slug &&
    ['sweet-treats', 'energy-immunity-booster', 'detox-fat-burners'].includes(product.category.slug);

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

  const hasDiscount = product.compare_at_price && product.compare_at_price > currentPrice;

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
              {displayImage ? (
                <img
                  src={displayImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                  onError={(e) => {
                    e.currentTarget.src = product.image_url || "";
                  }}
                />
              ) : (
                <div className="text-8xl bg-gradient-to-br from-brand-olive/10 via-brand-kraft to-brand-mustard/10 w-full h-full flex items-center justify-center">
                  {product.slug === 'egift-card' ? '🎁' : '🍹'}
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
                ${currentPrice.toFixed(2)}
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

            {/* Variants / Options Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-8">
                <span className="font-medium text-brand-brown block mb-3">
                  {product.slug === 'egift-card' ? 'Select Amount:' : 'Select Option:'}
                </span>
                <div className="flex flex-wrap gap-3">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariantId(variant.id)}
                      className={`
                        px-4 py-2 rounded-xl border-2 transition-all font-medium text-sm
                        ${selectedVariantId === variant.id
                          ? 'border-brand-berry bg-brand-berry/5 text-brand-berry'
                          : 'border-brand-warm-gray/20 text-brand-brown hover:border-brand-olive hover:text-brand-olive bg-white'}
                      `}
                    >
                      {variant.size_name}
                      {variant.is_subscription && <span className="block text-xs font-normal opacity-80">{variant.subscription_interval}</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Standard Size Selector (for regular products) */}
            {!product.variants?.length && product.slug !== 'egift-card' && globalSizes.length > 0 && !requiresFlavors && (
              <div className="mb-8">
                <span className="font-medium text-brand-brown block mb-3">
                  Select Size:
                </span>
                <div className="flex flex-wrap gap-3">
                  {globalSizes.map((size) => (
                    <button
                      key={size.id}
                      onClick={() => setSelectedSizeId(size.id)}
                      className={`
                        px-4 py-2 rounded-xl border-2 transition-all font-medium text-sm
                        ${selectedSizeId === size.id
                          ? 'border-brand-berry bg-brand-berry/5 text-brand-berry'
                          : 'border-brand-warm-gray/20 text-brand-brown hover:border-brand-olive hover:text-brand-olive bg-white'}
                      `}
                    >
                      {size.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons Selector */}
            {showAddons && addons && addons.length > 0 && (
              <div className="mb-8 p-5 bg-brand-olive/5 rounded-2xl border border-brand-olive/10">
                <h3 className="font-heading font-semibold text-lg text-brand-brown mb-3">Add Extra Goodness</h3>
                <div className="grid grid-cols-2 gap-3">
                  {addons.map(addon => (
                    <div key={addon.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={addon.id}
                        checked={selectedAddonIds.includes(addon.id)}
                        onCheckedChange={() => toggleAddon(addon.id)}
                        className="border-brand-olive text-brand-olive data-[state=checked]:bg-brand-olive data-[state=checked]:text-white"
                      />
                      <Label htmlFor={addon.id} className="text-sm font-medium cursor-pointer text-brand-brown">
                        {addon.display_name} (+${addon.price.toFixed(2)})
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Flavor Selector */}
            {requiresFlavors && (
              <div className="mb-8">
                <h3 className="font-heading font-semibold text-lg text-brand-brown mb-3">
                  Choose Flavors <span className="text-sm font-normal text-muted-foreground">(Select {flavorLimit})</span>
                </h3>
                <FlavorSelector
                  selectedFlavors={selectedFlavors}
                  onFlavorsChange={setSelectedFlavors}
                  maxFlavors={flavorLimit}
                />
              </div>
            )}

            {/* Gift Card Form */}
            {product.slug === 'egift-card' && (
              <div className="mb-8 p-6 bg-brand-kraft/20 rounded-2xl border border-brand-olive/10 space-y-4">
                <h3 className="font-heading font-semibold text-brand-brown">Recipient Details</h3>

                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium text-brand-warm-gray mb-1 block">To (Email) <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      className="w-full rounded-lg border-brand-warm-gray/20 px-3 py-2 bg-white"
                      placeholder="recipient@example.com"
                      value={giftCardForm.recipientEmail}
                      onChange={(e) => setGiftCardForm({ ...giftCardForm, recipientEmail: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brand-warm-gray mb-1 block">To (Name)</label>
                    <input
                      type="text"
                      className="w-full rounded-lg border-brand-warm-gray/20 px-3 py-2 bg-white"
                      placeholder="Recipient Name"
                      value={giftCardForm.recipientName}
                      onChange={(e) => setGiftCardForm({ ...giftCardForm, recipientName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brand-warm-gray mb-1 block">Message</label>
                    <textarea
                      className="w-full rounded-lg border-brand-warm-gray/20 px-3 py-2 bg-white h-24 resize-none"
                      placeholder="Add a personal message..."
                      value={giftCardForm.message}
                      onChange={(e) => setGiftCardForm({ ...giftCardForm, message: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

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
              sizeId={!selectedVariantId ? selectedSizeId || undefined : undefined}
              sizeOverrideId={selectedVariantId || undefined}
              giftCardData={product.slug === 'egift-card' ? giftCardForm : undefined}
              selectedFlavorIds={selectedFlavors.map(p => p.id)}
              addonIds={selectedAddonIds}
              disabled={isAddToCartDisabled()}
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

            {/* Reviews Section */}
            <div className="mt-12">
              <h3 className="font-heading font-semibold text-xl text-brand-brown mb-6">Customer Reviews</h3>
              <ReviewList productId={product.id} productName={product.name} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
