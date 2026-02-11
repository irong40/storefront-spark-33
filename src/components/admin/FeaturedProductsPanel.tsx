import { useState } from "react";
import { useProducts, Product } from "@/hooks/use-products";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, GripVertical, ArrowUp, ArrowDown } from "lucide-react";

export function FeaturedProductsPanel() {
  const { data: products, isLoading } = useProducts();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [updating, setUpdating] = useState<string | null>(null);

  const featuredProducts = products?.filter((p) => p.is_featured) || [];
  const nonFeaturedProducts = products?.filter((p) => !p.is_featured) || [];

  const toggleFeatured = async (product: Product) => {
    setUpdating(product.id);
    try {
      const { error } = await supabase
        .from("products")
        .update({ is_featured: !product.is_featured })
        .eq("id", product.id);

      if (error) throw error;

      toast({
        title: product.is_featured
          ? "Removed from featured"
          : "Added to featured",
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const moveFeatured = async (product: Product, direction: "up" | "down") => {
    const currentIndex = featuredProducts.findIndex((p) => p.id === product.id);
    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (newIndex < 0 || newIndex >= featuredProducts.length) return;

    setUpdating(product.id);
    try {
      const otherProduct = featuredProducts[newIndex];
      const currentOrder = product.sort_order;
      const otherOrder = otherProduct.sort_order;

      // Swap sort orders
      await Promise.all([
        supabase
          .from("products")
          .update({ sort_order: otherOrder })
          .eq("id", product.id),
        supabase
          .from("products")
          .update({ sort_order: currentOrder })
          .eq("id", otherProduct.id),
      ]);

      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (error) {
      toast({ title: "Failed to reorder", variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Featured Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-brand-mustard fill-brand-mustard" />
            Featured Products ({featuredProducts.length})
          </CardTitle>
          <CardDescription>
            These products appear on the homepage. Drag to reorder or toggle to
            remove.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {featuredProducts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No featured products yet. Toggle products below to feature them.
            </p>
          ) : (
            <div className="space-y-2">
              {featuredProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border"
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground" />

                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                  />

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ${product.price.toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => moveFeatured(product, "up")}
                      disabled={index === 0 || updating === product.id}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => moveFeatured(product, "down")}
                      disabled={
                        index === featuredProducts.length - 1 ||
                        updating === product.id
                      }
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <Switch
                    checked={product.is_featured}
                    onCheckedChange={() => toggleFeatured(product)}
                    disabled={updating === product.id}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Products */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            Toggle products to add them to the featured section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 max-h-96 overflow-y-auto">
            {nonFeaturedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 hover:bg-muted/50 rounded-lg border"
              >
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-10 h-10 object-cover rounded"
                />

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      ${product.price.toFixed(2)}
                    </span>
                    {product.category && (
                      <Badge variant="outline" className="text-xs">
                        {product.category.name}
                      </Badge>
                    )}
                  </div>
                </div>

                <Switch
                  checked={product.is_featured}
                  onCheckedChange={() => toggleFeatured(product)}
                  disabled={updating === product.id}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
