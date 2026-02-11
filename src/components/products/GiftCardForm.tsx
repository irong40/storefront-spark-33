import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCart } from "@/contexts/CartContext";
import { useProductSizeOverrides } from "@/hooks/use-product-variants";
import { format } from "date-fns";
import {
  CalendarIcon,
  Gift,
  Loader2,
  ShoppingCart,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface GiftCardFormProps {
  productId: string;
}

interface GiftCardItem {
  id: string;
  amount: number;
  sizeOverrideId: string;
  recipientType: "myself" | "someone_else";
  recipientEmail: string;
  recipientName: string;
  deliveryDate: Date;
  message: string;
}

const AMOUNT_OPTIONS = [25, 50, 100, 150, 200];

export function GiftCardForm({ productId }: GiftCardFormProps) {
  const { addItem } = useCart();
  const { data: sizeOverrides, isLoading } = useProductSizeOverrides(productId);

  const [giftCards, setGiftCards] = useState<GiftCardItem[]>([
    createEmptyCard(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function createEmptyCard(): GiftCardItem {
    return {
      id: crypto.randomUUID(),
      amount: 25,
      sizeOverrideId: "",
      recipientType: "someone_else",
      recipientEmail: "",
      recipientName: "",
      deliveryDate: new Date(),
      message: "",
    };
  }

  function updateCard(id: string, updates: Partial<GiftCardItem>) {
    setGiftCards((cards) =>
      cards.map((card) => (card.id === id ? { ...card, ...updates } : card)),
    );
  }

  function addCard() {
    setGiftCards([...giftCards, createEmptyCard()]);
  }

  function removeCard(id: string) {
    if (giftCards.length > 1) {
      setGiftCards(giftCards.filter((card) => card.id !== id));
    }
  }

  function getSizeOverrideForAmount(amount: number) {
    return sizeOverrides?.find((s) => s.price === amount);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Add each gift card to cart
      for (const card of giftCards) {
        const sizeOverride = getSizeOverrideForAmount(card.amount);

        const giftCardData = {
          recipientType: card.recipientType,
          recipientEmail:
            card.recipientType === "someone_else" ? card.recipientEmail : "",
          recipientName:
            card.recipientType === "someone_else" ? card.recipientName : "",
          deliveryDate: card.deliveryDate.toISOString(),
          message: card.message,
          amount: card.amount,
        };

        // Add to cart with gift card data
        await addItem(
          productId,
          1,
          undefined,
          sizeOverride?.id,
          [],
          giftCardData,
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const totalAmount = giftCards.reduce((sum, card) => sum + card.amount, 0);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {giftCards.map((card, index) => (
        <div
          key={card.id}
          className="border rounded-2xl p-6 space-y-5 relative"
        >
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">
                Gift Card {giftCards.length > 1 ? `#${index + 1}` : ""}
              </h3>
            </div>
            {giftCards.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeCard(card.id)}
                className="text-destructive hover:text-destructive"
              >
                Remove
              </Button>
            )}
          </div>

          {/* Amount Selection */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Select Amount
            </Label>
            <div className="grid grid-cols-5 gap-2">
              {AMOUNT_OPTIONS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => updateCard(card.id, { amount })}
                  className={cn(
                    "p-3 rounded-xl border-2 text-center transition-all font-semibold",
                    card.amount === amount
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  ${amount}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Type */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Who is this gift card for?
            </Label>
            <RadioGroup
              value={card.recipientType}
              onValueChange={(value: "myself" | "someone_else") =>
                updateCard(card.id, { recipientType: value })
              }
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="myself" id={`myself-${card.id}`} />
                <Label htmlFor={`myself-${card.id}`} className="cursor-pointer">
                  Myself
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem
                  value="someone_else"
                  id={`someone-${card.id}`}
                />
                <Label
                  htmlFor={`someone-${card.id}`}
                  className="cursor-pointer"
                >
                  For someone else
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Recipient Details (only if for someone else) */}
          {card.recipientType === "someone_else" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`email-${card.id}`}>Recipient Email *</Label>
                <Input
                  id={`email-${card.id}`}
                  type="email"
                  placeholder="recipient@example.com"
                  value={card.recipientEmail}
                  onChange={(e) =>
                    updateCard(card.id, { recipientEmail: e.target.value })
                  }
                  required={card.recipientType === "someone_else"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`name-${card.id}`}>Recipient Name *</Label>
                <Input
                  id={`name-${card.id}`}
                  type="text"
                  placeholder="John Doe"
                  value={card.recipientName}
                  onChange={(e) =>
                    updateCard(card.id, { recipientName: e.target.value })
                  }
                  required={card.recipientType === "someone_else"}
                />
              </div>
            </div>
          )}

          {/* Delivery Date */}
          {card.recipientType === "someone_else" && (
            <div className="space-y-2">
              <Label>Delivery Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !card.deliveryDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {card.deliveryDate
                      ? format(card.deliveryDate, "PPP")
                      : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={card.deliveryDate}
                    onSelect={(date) =>
                      date && updateCard(card.id, { deliveryDate: date })
                    }
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Personal Message */}
          <div className="space-y-2">
            <Label htmlFor={`message-${card.id}`}>
              Personal Message (optional)
            </Label>
            <Textarea
              id={`message-${card.id}`}
              placeholder="Write a personal message for the recipient..."
              value={card.message}
              onChange={(e) => updateCard(card.id, { message: e.target.value })}
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {card.message.length}/500
            </p>
          </div>
        </div>
      ))}

      {/* Add Another Card Button */}
      <Button
        type="button"
        variant="outline"
        onClick={addCard}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Gift Card
      </Button>

      {/* Total and Submit */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <p className="text-sm text-muted-foreground">
            {giftCards.length} gift card{giftCards.length > 1 ? "s" : ""}
          </p>
          <p className="text-2xl font-bold text-primary">
            ${totalAmount.toFixed(2)}
          </p>
        </div>
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          className="px-8"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ShoppingCart className="h-4 w-4 mr-2" />
          )}
          Add to Cart
        </Button>
      </div>
    </form>
  );
}
