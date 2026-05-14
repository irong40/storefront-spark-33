import { useState } from "react";
import {
  PaymentForm,
  CreditCard,
  ApplePay,
  GooglePay,
} from "react-square-web-payments-sdk";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CreditCard as CreditCardIcon, Lock } from "lucide-react";
import { logger } from "@/lib/logger";
import { Separator } from "@/components/ui/separator";
import { SQUARE_CONFIG } from "@/config/square";

interface SquarePaymentFormProps {
  amountInCents: number;
  sessionId: string; // Cart session ID for server-side validation
  onSuccess: (paymentResult: PaymentResult) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  redemptionId?: string | null;
}

export interface AppliedLoyalty {
  redemption_id: string;
  reward_type: string;
  discount: number;
  applied_to_product_id: string | null;
  applied_to_size_name: string | null;
  free_shipping: boolean;
}

export interface PaymentResult {
  paymentId: string;
  status: string;
  receiptUrl?: string;
  cardDetails?: {
    last4: string;
    brand: string;
  };
  walletType?: "apple_pay" | "google_pay" | "card";
  loyaltyApplied?: AppliedLoyalty | null;
}

export function SquarePaymentForm({
  amountInCents,
  sessionId,
  onSuccess,
  onError,
  disabled = false,
  redemptionId = null,
}: SquarePaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Get Square credentials from config
  const { applicationId, locationId } = SQUARE_CONFIG;

  const processPayment = async (
    token: string,
    walletType: "apple_pay" | "google_pay" | "card" = "card",
  ) => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      // Send session ID for server-side amount validation instead of client-provided amount
      const { data, error } = await supabase.functions.invoke(
        "process-payment",
        {
          body: {
            sourceId: token,
            sessionId: sessionId,
            redemptionId: redemptionId || undefined,
          },
        },
      );

      if (error) {
        logger.error("Edge function error:", error);
        throw new Error(error.message || "Payment processing failed");
      }

      if (data?.error) {
        logger.error("Payment error:", data.error);
        throw new Error(data.error);
      }

      if (data?.success && data?.payment) {
        onSuccess({
          paymentId: data.payment.id,
          status: data.payment.status,
          receiptUrl: data.payment.receiptUrl,
          cardDetails: data.payment.cardDetails,
          walletType,
          loyaltyApplied: data.loyaltyApplied ?? null,
        });
      } else {
        throw new Error("Unexpected payment response");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Payment failed. Please try again.";
      logger.error("Payment processing error:", errorMessage);
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-4 w-4" />
        <span>Secure payment powered by Square</span>
      </div>

      <PaymentForm
        applicationId={applicationId}
        locationId={locationId}
        cardTokenizeResponseReceived={async (token) => {
          if (token.status !== "OK" || !token.token) {
            logger.error("Card tokenization failed:", token);
            const errorResult = token as {
              errors?: Array<{ message?: string }>;
            };
            onError(
              errorResult.errors?.[0]?.message ||
                "Payment failed. Please try again.",
            );
            return;
          }

          // Detect wallet type from token details
          const tokenDetails = token as { details?: { method?: string } };
          let walletType: "apple_pay" | "google_pay" | "card" = "card";

          if (tokenDetails.details?.method === "Apple Pay") {
            walletType = "apple_pay";
          } else if (tokenDetails.details?.method === "Google Pay") {
            walletType = "google_pay";
          }

          await processPayment(token.token, walletType);
        }}
        createPaymentRequest={() => ({
          countryCode: "US",
          currencyCode: "USD",
          total: {
            amount: (amountInCents / 100).toFixed(2),
            label: "Total",
          },
        })}
      >
        {/* Digital Wallet Options */}
        <div className="space-y-3 mb-4">
          <ApplePay />
          <GooglePay />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <Separator className="flex-1" />
          <span className="text-sm text-muted-foreground">
            or pay with card
          </span>
          <Separator className="flex-1" />
        </div>

        {/* Credit Card Form */}
        <div className="relative">
          <CreditCard
            buttonProps={{
              css: {
                backgroundColor: "#22c55e",
                color: "#ffffff",
                fontSize: "16px",
                fontWeight: "600",
                padding: "16px",
                borderRadius: "12px",
                width: "100%",
                marginTop: "16px",
                cursor: "pointer",
              },
            }}
            style={{
              ".input-container": {
                borderColor: "#e5e7eb",
                borderRadius: "12px",
              },
              ".input-container.is-focus": {
                borderColor: "#22c55e",
              },
              ".input-container.is-error": {
                borderColor: "#ef4444",
              },
              ".message-text": {
                color: "#ef4444",
              },
              ".message-icon": {
                color: "#ef4444",
              },
              input: {
                backgroundColor: "#ffffff",
                color: "#111827",
                fontFamily: "Helvetica Neue, Arial, sans-serif",
              },
              "input::placeholder": {
                color: "#9ca3af",
              },
            }}
            includeInputLabels
            focus="cardNumber"
          />

          {isProcessing && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
              <div className="flex items-center gap-2 text-primary">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="font-medium">Processing payment...</span>
              </div>
            </div>
          )}
        </div>
      </PaymentForm>

      {/* Accepted Payment Methods */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <CreditCardIcon className="h-6 w-6 text-muted-foreground" />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
          alt="Visa"
          className="h-4 opacity-50"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
          alt="Mastercard"
          className="h-6 opacity-50"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg"
          alt="American Express"
          className="h-5 opacity-50"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/b/b0/Apple_Pay_logo.svg"
          alt="Apple Pay"
          className="h-5 opacity-50"
        />
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg"
          alt="Google Pay"
          className="h-5 opacity-50"
        />
      </div>
    </div>
  );
}
