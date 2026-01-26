import { useState } from 'react';
import { PaymentForm, CreditCard, ApplePay, GooglePay } from 'react-square-web-payments-sdk';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard as CreditCardIcon, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SQUARE_CONFIG } from '@/config/square';

interface SquarePaymentFormProps {
  amountInCents: number;
  onSuccess: (paymentResult: PaymentResult & { customerId?: string; cardId?: string }) => void;
  onError: (message: string) => void;
  disabled?: boolean;
  mode?: 'payment' | 'subscription';
  customerEmail?: string;
  userId?: string;
}

export interface PaymentResult {
  paymentId: string;
  status: string;
  receiptUrl?: string;
  cardDetails?: {
    last4: string;
    brand: string;
  };
  walletType?: 'apple_pay' | 'google_pay' | 'card';
}

export function SquarePaymentForm({
  amountInCents,
  onSuccess,
  onError,
  disabled = false
}: SquarePaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Get Square credentials from config
  const { applicationId, locationId } = SQUARE_CONFIG;

  const processPayment = async (token: string, walletType: 'apple_pay' | 'google_pay' | 'card' = 'card') => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);

    try {
      if (props.mode === 'subscription') {
        if (!props.customerEmail || !props.userId) {
          throw new Error('Missing customer details for subscription');
        }

        // 1. Create/Get Customer
        const { data: customerData, error: customerError } = await supabase.functions.invoke('square-subscription-manager', {
          body: {
            action: 'create_customer',
            email: props.customerEmail,
            userId: props.userId,
          },
        });

        if (customerError || !customerData?.success) {
          throw new Error(customerError?.message || 'Failed to initialize customer profile');
        }

        const customerId = customerData.data.customer.id;

        // 2. Save Card
        const { data: cardData, error: cardError } = await supabase.functions.invoke('square-subscription-manager', {
          body: {
            action: 'save_card',
            customerId,
            sourceId: token,
          },
        });

        if (cardError || !cardData?.success) {
          throw new Error(cardError?.message || 'Failed to save card');
        }

        // Return success with Card ID
        onSuccess({
          paymentId: 'SAVED_CARD', // Placeholder
          status: 'COMPLETED',
          cardDetails: {
            last4: cardData.data.card.last_4,
            brand: cardData.data.card.card_brand,
          },
          walletType,
          customerId, // Pass this back
          cardId: cardData.data.card.id // Pass this back
        } as PaymentResult & { customerId: string, cardId: string });

      } else {
        // Standard One-Time Payment
        const { data, error } = await supabase.functions.invoke('process-payment', {
          body: {
            sourceId: token,
            amount: amountInCents,
          },
        });

        if (error) {
          throw new Error(error.message || 'Payment processing failed');
        }

        if (data?.error) {
          throw new Error(data.error);
        }

        if (data?.success && data?.payment) {
          onSuccess({
            paymentId: data.payment.id,
            status: data.payment.status,
            receiptUrl: data.payment.receiptUrl,
            cardDetails: data.payment.cardDetails,
            walletType,
          });
        } else {
          throw new Error('Unexpected payment response');
        }
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Payment failed. Please try again.';
      console.error('Payment processing error:', errorMessage);
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
          if (token.status !== 'OK' || !token.token) {
            console.error('Card tokenization failed:', token);
            const errorResult = token as { errors?: Array<{ message?: string }> };
            onError(errorResult.errors?.[0]?.message || 'Payment failed. Please try again.');
            return;
          }

          // Detect wallet type from token details
          const tokenDetails = token as { details?: { method?: string } };
          let walletType: 'apple_pay' | 'google_pay' | 'card' = 'card';

          if (tokenDetails.details?.method === 'Apple Pay') {
            walletType = 'apple_pay';
          } else if (tokenDetails.details?.method === 'Google Pay') {
            walletType = 'google_pay';
          }

          await processPayment(token.token, walletType);
        }}
        createPaymentRequest={() => ({
          countryCode: 'US',
          currencyCode: 'USD',
          total: {
            amount: (amountInCents / 100).toFixed(2),
            label: 'Total',
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
          <span className="text-sm text-muted-foreground">or pay with card</span>
          <Separator className="flex-1" />
        </div>

        {/* Credit Card Form */}
        <div className="relative">
          <CreditCard
            buttonProps={{
              css: {
                backgroundColor: 'hsl(142, 76%, 36%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                padding: '16px',
                borderRadius: '0.75rem',
                width: '100%',
                marginTop: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
              },
            }}
            style={{
              '.input-container': {
                borderColor: 'hsl(var(--border))',
                borderRadius: '0.75rem',
              },
              '.input-container.is-focus': {
                borderColor: 'hsl(var(--primary))',
              },
              '.input-container.is-error': {
                borderColor: 'hsl(var(--destructive))',
              },
              '.message-text': {
                color: 'hsl(var(--destructive))',
              },
              '.message-icon': {
                color: 'hsl(var(--destructive))',
              },
              input: {
                backgroundColor: 'hsl(var(--background))',
                color: 'hsl(var(--foreground))',
                fontFamily: 'inherit',
              },
              'input::placeholder': {
                color: 'hsl(var(--muted-foreground))',
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
