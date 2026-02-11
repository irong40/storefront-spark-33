import { useTopProducts } from "@/hooks/use-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Package } from "lucide-react";
import { cn } from "@/lib/utils";

const rankIcons = [
  { icon: Trophy, color: "text-yellow-500" },
  { icon: Medal, color: "text-gray-400" },
  { icon: Award, color: "text-amber-600" },
];

export function TopProductsPanel() {
  const { data: products, isLoading } = useTopProducts(5);

  return (
    <Card className="shadow-soft h-full">
      <CardHeader>
        <CardTitle className="text-lg font-heading">Top Products</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <Package className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No product sales yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product, index) => {
              const RankIcon = rankIcons[index]?.icon || null;
              const rankColor =
                rankIcons[index]?.color || "text-muted-foreground";

              return (
                <div
                  key={product.id || index}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg transition-colors",
                    index === 0
                      ? "bg-yellow-50 dark:bg-yellow-950/20"
                      : "hover:bg-muted/50",
                  )}
                >
                  <div className="flex-shrink-0 w-8 flex justify-center">
                    {RankIcon ? (
                      <RankIcon className={cn("h-5 w-5", rankColor)} />
                    ) : (
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                    )}
                  </div>

                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {product.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {product.unitsSold} sold
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-brand-olive">
                      ${product.revenue.toFixed(2)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
