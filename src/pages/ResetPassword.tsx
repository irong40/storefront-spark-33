import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Lock, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function ResetPassword() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isValidToken, setIsValidToken] = useState(false);

    useEffect(() => {
        // Check if we have a valid session (user clicked reset link)
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setIsValidToken(true);
            } else {
                setError('Invalid or expired reset link. Please request a new one.');
            }
        });
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        const { error } = await supabase.auth.updateUser({
            password: password,
        });

        if (error) {
            setError(error.message);
            setIsLoading(false);
        } else {
            toast({
                title: 'Password Updated!',
                description: 'Your password has been successfully reset.',
            });

            // Sign out to force fresh login with new password
            await supabase.auth.signOut();

            // Redirect to login
            setTimeout(() => {
                navigate('/auth');
            }, 1000);
        }
    };

    if (!isValidToken && error) {
        return (
            <Layout>
                <div className="container max-w-md mx-auto px-4 py-16">
                    <div className="bg-card rounded-2xl border-2 border-border p-8 shadow-lg">
                        <Alert variant="destructive">
                            <AlertDescription className="text-center">
                                <p className="font-medium mb-2">Invalid Reset Link</p>
                                <p className="text-sm">{error}</p>
                            </AlertDescription>
                        </Alert>
                        <Button
                            onClick={() => navigate('/forgot-password')}
                            variant="outline"
                            className="w-full mt-4"
                        >
                            Request New Reset Link
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="container max-w-md mx-auto px-4 py-16">
                <div className="bg-card rounded-2xl border-2 border-border p-8 shadow-lg">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-display font-bold text-foreground mb-2">
                            Reset Your Password
                        </h1>
                        <p className="text-muted-foreground">
                            Enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="At least 6 characters"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                minLength={6}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                                minLength={6}
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting Password...
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Reset Password
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
