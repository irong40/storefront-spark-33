import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GiftCardBalance() {
    const [code, setCode] = useState('');
    const [balance, setBalance] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { toast } = useToast();

    const handleCheck = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setBalance(null);

        try {
            // TODO: Implement when gift_cards table and check_gift_card_balance RPC exist
            // For now, show a placeholder message
            setError('Gift card balance check is coming soon!');
        } catch (err) {
            console.error(err);
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
                            Enter the 16-digit code from your email or card.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCheck} className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="e.g. ABCD-1234-EFGH-5678"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    className="text-center font-mono uppercase tracking-widest text-lg h-12"
                                    maxLength={19}
                                />
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg text-sm justify-center">
                                    <AlertCircle className="w-4 h-4" />
                                    {error}
                                </div>
                            )}

                            {balance !== null && (
                                <div className="flex flex-col items-center gap-2 text-primary bg-primary/10 p-4 rounded-xl border border-primary/20 animate-in fade-in zoom-in duration-300">
                                    <span className="text-sm font-medium uppercase tracking-wider">Current Balance</span>
                                    <span className="font-heading text-4xl font-bold">${balance.toFixed(2)}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg"
                                disabled={loading || !code}
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
