import { useProducts, Product } from '@/hooks/use-products';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface FlavorSelectorProps {
    maxFlavors?: number;
    selectedFlavors: Product[];
    onFlavorsChange: (flavors: Product[]) => void;
    excludeCategorySlug?: string; // Exclude categories like 'subscriptions' and 'detox-packages'
}

export function FlavorSelector({
    maxFlavors = 3,
    selectedFlavors,
    onFlavorsChange,
    excludeCategorySlug
}: FlavorSelectorProps) {
    const { data: products, isLoading } = useProducts();

    // Filter to only show regular juices (exclude subscriptions, detox packages, and wellness shots)
    const availableFlavors = products?.filter(p => {
        // Exclude wellness shots
        if (p.slug?.startsWith('wellness-shot')) return false;
        // Exclude detox packages (1-day, 3-day detox)
        if (p.slug?.includes('-day-detox')) return false;
        // Exclude subscriptions
        if (p.slug?.includes('subscription')) return false;
        // Only include products from juice categories
        const juiceCategories = ['sweet-treats', 'energy-immunity-booster', 'detox-fat-burners'];
        return p.is_available && p.active && p.category?.slug && juiceCategories.includes(p.category.slug);
    }) || [];

    const handleFlavorToggle = (product: Product) => {
        const isSelected = selectedFlavors.find(f => f.id === product.id);

        if (isSelected) {
            // Remove flavor
            onFlavorsChange(selectedFlavors.filter(f => f.id !== product.id));
        } else {
            // Add flavor only if under limit
            if (selectedFlavors.length < maxFlavors) {
                onFlavorsChange([...selectedFlavors, product]);
            }
        }
    };

    const removeFlavor = (productId: string) => {
        onFlavorsChange(selectedFlavors.filter(f => f.id !== productId));
    };

    if (isLoading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Selected Flavors Summary */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">
                        Selected Flavors ({selectedFlavors.length}/{maxFlavors})
                    </h4>
                    {selectedFlavors.length < maxFlavors && (
                        <span className="text-xs text-muted-foreground">
                            Choose {maxFlavors - selectedFlavors.length} more
                        </span>
                    )}
                </div>

                {selectedFlavors.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                        {selectedFlavors.map((flavor) => (
                            <Badge
                                key={flavor.id}
                                variant="secondary"
                                className="pl-3 pr-1 py-1 flex items-center gap-1"
                            >
                                {flavor.name}
                                <button
                                    onClick={() => removeFlavor(flavor.id)}
                                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">No flavors selected yet</p>
                )}
            </div>

            {/* Available Flavors Grid */}
            <div className="border rounded-xl p-4 max-h-64 overflow-y-auto space-y-2">
                <h4 className="font-semibold text-sm mb-3 sticky top-0 bg-background pb-2">
                    Available Juices
                </h4>
                {availableFlavors.map((product) => {
                    const isSelected = !!selectedFlavors.find(f => f.id === product.id);
                    const isDisabled = !isSelected && selectedFlavors.length >= maxFlavors;

                    return (
                        <div
                            key={product.id}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${isSelected
                                ? 'bg-primary/10 border border-primary'
                                : isDisabled
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-muted'
                                }`}
                            onClick={() => !isDisabled && handleFlavorToggle(product)}
                        >
                            <Checkbox
                                checked={isSelected}
                                disabled={isDisabled}
                                onCheckedChange={() => !isDisabled && handleFlavorToggle(product)}
                            />
                            <div className="flex-1 min-w-0">
                                <Label className="cursor-pointer font-medium text-sm">
                                    {product.name}
                                </Label>
                                {product.short_description && (
                                    <p className="text-xs text-muted-foreground truncate">
                                        {product.short_description}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
