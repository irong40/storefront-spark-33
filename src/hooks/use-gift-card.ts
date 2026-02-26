import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

// Accepts both raw (GCXXXXXXXXXXXX) and formatted (GC-XXXX-XXXX-XXXX) codes
const giftCardCodeSchema = z
  .string()
  .min(1, "Gift card code is required")
  .transform((v) => v.replace(/-/g, "").toUpperCase())
  .refine((v) => /^GC[A-Z0-9]{12}$/.test(v), {
    message: "Invalid gift card code format",
  });

interface GiftCardBalance {
  id: string;
  code: string;
  balance: number;
  status: string;
  expires_at: string | null;
}

interface RedemptionResult {
  success: boolean;
  message: string;
  remaining_balance: number;
}

export function useGiftCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkBalance = async (
    code: string,
  ): Promise<GiftCardBalance | null> => {
    const validation = giftCardCodeSchema.safeParse(code);
    if (!validation.success) {
      setError(validation.error.errors[0].message);
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc(
        "check_gift_card_balance",
        {
          gift_card_code: code,
        },
      );

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        setError("Gift card not found or expired");
        return null;
      }

      return data[0] as GiftCardBalance;
    } catch (err) {
      logger.error("Error checking gift card:", err);
      setError("Failed to check gift card");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const redeemGiftCard = async (
    code: string,
    amount: number,
    orderId?: string,
  ): Promise<RedemptionResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc("redeem_gift_card", {
        gift_card_code: code,
        redeem_amount: amount,
        for_order_id: orderId ?? undefined,
      });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        setError("Failed to redeem gift card");
        return null;
      }

      const result = data[0] as RedemptionResult;
      if (!result.success) {
        setError(result.message);
      }
      return result;
    } catch (err) {
      logger.error("Error redeeming gift card:", err);
      setError("Failed to redeem gift card");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkBalance,
    redeemGiftCard,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
