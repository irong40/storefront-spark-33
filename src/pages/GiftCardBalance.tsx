import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface GiftCardResult {
  id: string;
  code: string;
  balance: number;
  status: string;
  expires_at: string | null;
}

export default function GiftCardBalance() {
  const [code, setCode] = useState('');
  const [result, setResult] = useState<GiftCardResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatCode = (value: string) => {
    // Remove all non-alphanumeric characters
    const clean = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // Add dashes: GC-XXXX-XXXX-XXXX format
    const parts = [];
    if (clean.length > 0) parts.push(clean.slice(0, 2)); // GC
    if (clean.length > 2) parts.push(clean.slice(2, 6)); // XXXX
    if (clean.length > 6) parts.push(clean.slice(6, 10)); // XXXX
    if (clean.length > 10) parts.push(clean.slice(10, 14)); // XXXX
    return parts.join('-');
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCode(formatCode(e.target.value));
  };

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('check_gift_card_balance', {
        gift_card_code: code,
      });

      if (rpcError) throw rpcError;

      if (!data || data.length === 0) {
        setError('Gift card not found or has expired. Please check the code and try again.');
      } else {
        setResult(data[0] as GiftCardResult);
      }
    } catch (err) {
      console.error('Error checking gift card:', err);
      setError('Failed to check balance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container min-h-[60vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md border-2 border-primary/20 shadow-xl bg-background/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <CreditCard className="w-8 h-8" />
            </div>
            <CardTitle className="font-heading text-2xl">Check Gift Card Balance</CardTitle>
            <CardDescription>
              Enter the code from your gift card email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheck} className="space-y-4">
              <div className="space-y-2">
                <Input
                  placeholder="GC-XXXX-XXXX-XXXX"
                  value={code}
                  onChange={handleCodeChange}
                  className="text-center font-mono uppercase tracking-widest text-lg h-12"
                  maxLength={17}
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg text-sm justify-center">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {result && (
                <div className="flex flex-col items-center gap-3 text-primary bg-primary/10 p-5 rounded-xl border border-primary/20 animate-in fade-in zoom-in duration-300">
                  <CheckCircle className="w-8 h-8" />
                  <span className="text-sm font-medium uppercase tracking-wider">Current Balance</span>
                  <span className="font-heading text-4xl font-bold">${result.balance.toFixed(2)}</span>
                  {result.expires_at && (
                    <span className="text-xs text-muted-foreground">
                      Expires: {new Date(result.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={loading || code.length < 17}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Check Balance'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
