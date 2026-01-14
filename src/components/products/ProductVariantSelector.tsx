import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useProductSizes, useProductAddons, ProductSize, ProductAddon } from '@/hooks/use-product-variants';
import { ShoppingCart, Loader2, Check } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface ProductVariantSelectorProps {
    productId: string;
    productName: string;
    disabled?: boolean;
}

export function ProductVariantSelector({ productId, productName, disabled }: ProductVariantSelectorProps) {
    const { addItem } = useCart();
    const { data: sizes, isLoading: sizesLoading } = useProductSizes();
    const { data: addons, isLoading: addonsLoading } = useProductAddons();

    const [selectedSize, setSelectedSize] = useState<ProductSize | null>(null);
    const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    // Set default size when sizes load
    if (sizes && sizes.length > 0 && !selectedSize) {
        const defaultSize = sizes.find(s => s.name === '16 oz') || sizes[0];
        setSelectedSize(defaultSize);
    }

    const handleAddonToggle = (addon: ProductAddon) => {
        // "Standard" is mutually exclusive with other addons
        if (addon.name === 'standard') {
            setSelectedAddons([addon]);
        } else {
            // Remove standard if selecting another addon
            const withoutStandard = selectedAddons.filter(a => a.name !== 'standard');

            if (selectedAddons.find(a => a.id === addon.id)) {
                setSelectedAddons(withoutStandard.filter(a => a.id !== addon.id));
            } else {
                setSelectedAddons([...withoutStandard, addon]);
            }
        }
    };

    const calculateTotal = () => {
        const sizePrice = selectedSize?.price || 0;
        const addonsPrice = selectedAddons.reduce((sum, addon) => sum + Number(addon.price), 0);
        return sizePrice + addonsPrice;
    };

    async function handleAddToCart() {
        if (!selectedSize) return;

        setIsAdding(true);
        try {
            await addItem(productId, 1, selectedSize.id, undefined, selectedAddons.map(a => a.id));
        } finally {
            setIsAdding(false);
        }
    }

    if (sizesLoading || addonsLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Size Selection */}
            <div>
                <h3 className="font-semibold text-sm mb-3">Size</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {sizes?.map((size) => (
                        <button
                            key={size.id}
                            onClick={() => setSelectedSize(size)}
                            className={`p-3 rounded-xl border-2 text-center transition-all ${selectedSize?.id === size.id
                                    ? 'border-primary bg-primary/10 text-primary'
                                    : 'border-border hover:border-primary/50'
                                }`}
                        >
                            <div className="font-semibold">{size.name}</div>
                            <div className="text-sm text-muted-foreground">${Number(size.price).toFixed(2)}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Add-ons Selection */}
            <div>
                <h3 className="font-semibold text-sm mb-3">Add Ingredients (optional)</h3>
                <div className="space-y-2">
                    {addons?.map((addon) => (
                        <div
                            key={addon.id}
                            className={`flex items-center justify-between p-3 rounded-xl border-2 cursor-pointer transition-all ${selectedAddons.find(a => a.id === addon.id)
                                    ? 'border-primary bg-primary/10'
                                    : 'border-border hover:border-primary/50'
                                }`}
                            onClick={() => handleAddonToggle(addon)}
                        >
                            <div className="flex items-center gap-3">
                                <Checkbox
                                    checked={!!selectedAddons.find(a => a.id === addon.id)}
                                    onCheckedChange={() => handleAddonToggle(addon)}
                                />
                                <Label className="cursor-pointer font-medium">{addon.display_name}</Label>
                            </div>
                            {Number(addon.price) > 0 && (
                                <span className="text-sm text-muted-foreground">+${Number(addon.price).toFixed(2)}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Total and Add to Cart */}
            <div className="flex items-center justify-between pt-4 border-t">
                <div>
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold text-primary">${calculateTotal().toFixed(2)}</div>
                </div>
                <Button
                    onClick={handleAddToCart}
                    disabled={disabled || isAdding || !selectedSize}
                    size="lg"
                    className="px-8"
                >
                    {isAdding ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                        <ShoppingCart className="h-4 w-4 mr-2" />
                    )}
                    Add to Cart
                </Button>
            </div>
        </div>
    );
}
