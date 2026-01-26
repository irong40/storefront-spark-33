import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarClock, Pause, Play, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Subscription } from '@/types/subscription';

interface SubscriptionsTabProps {
    user: any;
}

export function SubscriptionsTab({ user }: SubscriptionsTabProps) {
    const { toast } = useToast();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchSubscriptions();
    }, [user]);

    async function fetchSubscriptions() {
        if (!user) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setSubscriptions(data as Subscription[]);
        }
        setIsLoading(false);
    }

    async function handleAction(subscriptionId: string, action: 'cancel_subscription' | 'pause_subscription' | 'resume_subscription') {
        setProcessingId(subscriptionId);
        try {
            const { data, error } = await supabase.functions.invoke('square-subscription-manager', {
                body: {
                    action,
                    subscriptionId: subscriptions.find(s => s.id === subscriptionId)?.square_subscription_id
                }
            });

            if (error || !data?.success) {
                throw new Error(error?.message || 'Action failed');
            }

            toast({
                title: 'Success',
                description: `Subscription updated successfully.`,
            });

            setSubscriptions(prev => prev.map(sub => {
                if (sub.id === subscriptionId) {
                    if (action === 'cancel_subscription') return { ...sub, status: 'canceled' as const };
                    if (action === 'pause_subscription') return { ...sub, status: 'paused' as const };
                    if (action === 'resume_subscription') return { ...sub, status: 'active' as const };
                }
                return sub;
            }));

        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message || 'Failed to update subscription',
                variant: 'destructive',
            });
        } finally {
            setProcessingId(null);
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
            </div>
        );
    }

    if (subscriptions.length === 0) {
        return (
            <div className="text-center py-12">
                <CalendarClock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">No active subscriptions</p>
                <p className="text-muted-foreground mb-6">
                    Subscribe to your favorite juices to save time and money.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {subscriptions.map((sub) => (
                <div key={sub.id} className="bg-card rounded-xl border border-border p-6 flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{sub.product_name}</h3>
                            <Badge variant={sub.status === 'active' ? 'default' : 'secondary'}>
                                {sub.status.toUpperCase()}
                            </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                            Interval: <span className="font-medium text-foreground">{sub.interval}</span>
                        </p>
                        <p className="text-muted-foreground text-sm">
                            Amount: <span className="font-medium text-foreground">${(sub.amount / 100).toFixed(2)}</span>
                        </p>
                        {sub.current_period_end && (
                            <p className="text-xs text-muted-foreground">
                                Next billing: {new Date(sub.current_period_end).toLocaleDateString()}
                            </p>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {sub.status === 'active' && (
                            <>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAction(sub.id, 'pause_subscription')}
                                    disabled={!!processingId}
                                >
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" disabled={!!processingId}>
                                            <X className="h-4 w-4 mr-2" />
                                            Cancel
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Cancel Subscription?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Are you sure you want to cancel your subscription to {sub.product_name}? You will lose your locked-in pricing.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Keep Subscription</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAction(sub.id, 'cancel_subscription')} className="bg-destructive hover:bg-destructive/90">
                                                Yes, Cancel
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </>
                        )}

                        {sub.status === 'paused' && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleAction(sub.id, 'resume_subscription')}
                                disabled={!!processingId}
                            >
                                <Play className="h-4 w-4 mr-2" />
                                Resume
                            </Button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
