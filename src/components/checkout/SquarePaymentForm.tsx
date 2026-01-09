import { useState } from 'react';
import { PaymentForm, CreditCard } from 'react-square-web-payments-sdk';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard as CreditCardIcon, Lock } from 'lucide-react';

interface SquarePaymentFormProps {
  amountInCents: number;
  onSuccess: (paymentResult: PaymentResult) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}

export interface PaymentResult {
  paymentId: string;
  status: string;
  receiptUrl?: string;
  cardDetails?: {
    last4: string;
    brand: string;
  };
}

export function SquarePaymentForm({ 
  amountInCents, 
  onSuccess, 
  onError,
  disabled = false 
}: SquarePaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // Get Square credentials from environment
  const applicationId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
  const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

  if (!applicationId || !locationId) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
        <p className="text-destructive text-sm">
          Payment configuration error. Please contact support.
        </p>
      </div>
    );
  }

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
          if (disabled || isProcessing) return;
          
          // Check if tokenization was successful
          if (token.status !== 'OK' || !token.token) {
            console.error('Card tokenization failed:', token);
            const errorResult = token as { errors?: Array<{ message?: string }> };
            onError(errorResult.errors?.[0]?.message || 'Card tokenization failed. Please check your card details.');
            return;
          }
          
          setIsProcessing(true);
          
          try {
            console.log('Payment token received, processing...');

            const { data, error } = await supabase.functions.invoke('process-payment', {
              body: {
                sourceId: token.token,
                amount: amountInCents,
              },
            });

            if (error) {
              console.error('Edge function error:', error);
              throw new Error(error.message || 'Payment processing failed');
            }

            if (data?.error) {
              console.error('Payment error:', data.error);
              throw new Error(data.error);
            }

            if (data?.success && data?.payment) {
              console.log('Payment successful:', data.payment.id);
              onSuccess({
                paymentId: data.payment.id,
                status: data.payment.status,
                receiptUrl: data.payment.receiptUrl,
                cardDetails: data.payment.cardDetails,
              });
            } else {
              throw new Error('Unexpected payment response');
            }
          } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'Payment failed. Please try again.';
            console.error('Payment processing error:', errorMessage);
            onError(errorMessage);
          } finally {
            setIsProcessing(false);
          }
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
        <div className="relative">
          <CreditCard 
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
      </div>
    </div>
  );
}
