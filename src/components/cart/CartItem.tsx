import { Button } from "@/components/ui/button";
import { useCart, CartItem as CartItemType } from "@/contexts/CartContext";
import { Minus, Plus, Trash2, Gift } from "lucide-react";
import { Link } from "react-router-dom";
import { ProductImage } from "@/components/ui/ProductImage";

interface CartItemProps {
  item: CartItemType;
}

export function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem, isMutating } = useCart();
  const {
    product,
    quantity,
    size,
    size_override,
    addons,
    flavors,
    gift_card_data,
    dressing,
  } = item;

  // Calculate item price: variant override > standard size > base price
  let basePrice = Number(product.price);
  if (size_override) {
    basePrice = Number(size_override.price);
  } else if (size) {
    basePrice = Number(size.price);
  }

  // Add addon prices
  const addonsTotal =
    addons?.reduce((sum, addon) => sum + Number(addon.price), 0) || 0;
  const itemPrice = basePrice + addonsTotal;
  const lineTotal = itemPrice * quantity;

  const isGiftCard = !!gift_card_data;

  return (
    <div className="flex gap-4">
      <Link to={`/products/${product.slug}`} className="shrink-0">
        <div className="h-20 w-20 rounded-lg bg-secondary flex items-center justify-center overflow-hidden">
          {isGiftCard && !product.image_url ? (
            <Gift className="h-8 w-8 text-muted-foreground" />
          ) : (
            <ProductImage
              src={product.image_url}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          )}
        </div>
      </Link>

      <div className="flex-1 min-w-0">
        <Link
          to={`/products/${product.slug}`}
          className="font-medium hover:text-primary truncate block"
        >
          {product.name}
        </Link>

        {/* Size info */}
        {size_override && (
          <p className="text-xs text-muted-foreground">
            {size_override.size_name}
          </p>
        )}
        {size && !size_override && (
          <p className="text-xs text-muted-foreground">Size: {size.name}</p>
        )}

        {/* Flavors */}
        {flavors && flavors.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Flavors: {flavors.map((f) => f.name).join(", ")}
          </p>
        )}

        {/* Add-ons */}
        {addons && addons.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Add-ons: {addons.map((a) => a.display_name).join(", ")} (+$
            {addonsTotal.toFixed(2)})
          </p>
        )}

        {/* Dressing (salads) */}
        {dressing && (
          <p className="text-xs text-muted-foreground">Dressing: {dressing}</p>
        )}

        {/* Gift card info */}
        {isGiftCard && gift_card_data && (
          <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
            <p className="flex items-center gap-1">
              <Gift className="h-3 w-3" />
              To:{" "}
              {gift_card_data.recipientName || gift_card_data.recipientEmail}
            </p>
            {gift_card_data.deliveryDate && (
              <p>
                Deliver:{" "}
                {new Date(gift_card_data.deliveryDate).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground mt-1">
          ${itemPrice.toFixed(2)} each
        </p>

        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(item.id, quantity - 1)}
            disabled={isMutating}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center">{quantity}</span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => updateQuantity(item.id, quantity + 1)}
            disabled={isMutating}
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => removeItem(item.id)}
            disabled={isMutating}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="text-right">
        <p className="font-medium">${lineTotal.toFixed(2)}</p>
      </div>
    </div>
  );
}
