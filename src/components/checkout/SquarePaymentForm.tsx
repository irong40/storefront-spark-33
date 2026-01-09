import { useState } from 'react';
import { PaymentForm, CreditCard, ApplePay, GooglePay } from 'react-square-web-payments-sdk';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CreditCard as CreditCardIcon, Lock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SQUARE_CONFIG } from '@/config/square';

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
      console.log(`Processing ${walletType} payment...`);

      const { data, error } = await supabase.functions.invoke('process-payment', {
        body: {
          sourceId: token,
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
          walletType,
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
            onError(errorResult.errors?.[0]?.message || 'Card tokenization failed. Please check your card details.');
            return;
          }
          await processPayment(token.token, 'card');
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
