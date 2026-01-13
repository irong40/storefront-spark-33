import {
    useLoyaltyMember,
    useLoyaltyTransactions,
    useLoyaltyRewards,
    useLoyaltyRedemptions,
    useRedeemReward,
    getTier,
    getPointsToNextTier
} from '@/hooks/use-loyalty';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Gift, Star, Trophy, Zap, Clock, Check, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';

const TIER_COLORS = {
    bronze: 'bg-amber-700 text-white',
    silver: 'bg-gray-400 text-gray-900',
    gold: 'bg-yellow-500 text-yellow-900',
    platinum: 'bg-gradient-to-r from-gray-600 to-gray-400 text-white',
};

const TIER_ICONS = {
    bronze: '🥉',
    silver: '🥈',
    gold: '🥇',
    platinum: '💎',
};

export function LoyaltyDashboard() {
    const { user } = useAuth();
    const { data: member, isLoading: memberLoading } = useLoyaltyMember();
    const { data: transactions, isLoading: txLoading } = useLoyaltyTransactions(5);
    const { data: rewards, isLoading: rewardsLoading } = useLoyaltyRewards();
    const { data: redemptions } = useLoyaltyRedemptions();
    const redeemMutation = useRedeemReward();
    const { toast } = useToast();

    if (!user) {
        return (
            <Card className="text-center py-12">
                <CardContent>
                    <Gift className="h-16 w-16 mx-auto mb-4 text-primary" />
                    <h2 className="text-2xl font-bold mb-2">Join Our Loyalty Program</h2>
                    <p className="text-muted-foreground mb-6">
                        Sign up and get <strong>25 bonus points</strong> instantly!
                    </p>
                    <Button asChild size="lg">
                        <Link to="/auth">Sign Up Now</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (memberLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    const nextTier = member ? getPointsToNextTier(member.lifetime_points) : null;
    const progressToNextTier = member && nextTier ?
        ((member.lifetime_points / (member.lifetime_points + nextTier.pointsNeeded)) * 100) : 100;

    const handleRedeem = async (rewardId: string) => {
        try {
            const result = await redeemMutation.mutateAsync(rewardId);
            if (result && 'code' in result) {
                toast({
                    title: 'Reward Redeemed!',
                    description: `Your code: ${result.code}`,
                });
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error instanceof Error ? error.message : 'Failed to redeem reward',
                variant: 'destructive',
            });
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast({ title: 'Code copied!' });
    };

    return (
        <div className="space-y-8">
            {/* Points Overview Card */}
            <Card className="overflow-hidden">
                <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm opacity-80">Your Points Balance</p>
                            <p className="text-5xl font-bold">{member?.points_balance || 0}</p>
                        </div>
                        <div className="text-right">
                            <Badge className={TIER_COLORS[member?.tier || 'bronze']}>
                                {TIER_ICONS[member?.tier || 'bronze']} {member?.tier?.toUpperCase() || 'BRONZE'}
                            </Badge>
                            <p className="text-sm opacity-80 mt-2">
                                Lifetime: {member?.lifetime_points || 0} pts
                            </p>
                        </div>
                    </div>

                    {nextTier && (
                        <div className="mt-4">
                            <div className="flex justify-between text-sm mb-1">
                                <span>Progress to {nextTier.nextTier}</span>
                                <span>{nextTier.pointsNeeded} pts to go</span>
                            </div>
                            <Progress value={progressToNextTier} className="h-2 bg-white/20" />
                        </div>
                    )}
                </div>

                <CardContent className="p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <Zap className="h-6 w-6 mx-auto mb-1 text-primary" />
                            <p className="text-xs text-muted-foreground">Earn Points</p>
                            <p className="font-semibold">1 pt / $1</p>
                        </div>
                        <div>
                            <Star className="h-6 w-6 mx-auto mb-1 text-primary" />
                            <p className="text-xs text-muted-foreground">Sign Up Bonus</p>
                            <p className="font-semibold">25 pts</p>
                        </div>
                        <div>
                            <Trophy className="h-6 w-6 mx-auto mb-1 text-primary" />
                            <p className="text-xs text-muted-foreground">Member Since</p>
                            <p className="font-semibold">
                                {member?.joined_at ? format(new Date(member.joined_at), 'MMM yyyy') : '-'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Active Reward Codes */}
            {redemptions && redemptions.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Gift className="h-5 w-5" />
                            Your Active Rewards
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {redemptions.map((redemption) => (
                            <div
                                key={redemption.id}
                                className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                                <div>
                                    <p className="font-medium">{redemption.reward?.name}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        Expires {format(new Date(redemption.expires_at), 'MMM d, yyyy')}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <code className="bg-background px-3 py-1 rounded text-sm font-mono">
                                        {redemption.code}
                                    </code>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => copyCode(redemption.code)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Available Rewards */}
            <Card>
                <CardHeader>
                    <CardTitle>Redeem Your Points</CardTitle>
                    <CardDescription>Choose from available rewards</CardDescription>
                </CardHeader>
                <CardContent>
                    {rewardsLoading ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-24 rounded-lg" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {rewards?.map((reward) => {
                                const canRedeem = (member?.points_balance || 0) >= reward.points_required;

                                return (
                                    <div
                                        key={reward.id}
                                        className={`p-4 rounded-xl border-2 transition-all ${canRedeem
                                                ? 'border-primary/20 hover:border-primary/50'
                                                : 'border-border opacity-60'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <h4 className="font-semibold">{reward.name}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    {reward.description}
                                                </p>
                                            </div>
                                            <Badge variant={canRedeem ? 'default' : 'secondary'}>
                                                {reward.points_required} pts
                                            </Badge>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={!canRedeem || redeemMutation.isPending}
                                            onClick={() => handleRedeem(reward.id)}
                                            className="w-full mt-2"
                                        >
                                            {canRedeem ? 'Redeem' : `Need ${reward.points_required - (member?.points_balance || 0)} more pts`}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    {txLoading ? (
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <Skeleton key={i} className="h-12 rounded-lg" />
                            ))}
                        </div>
                    ) : transactions?.length === 0 ? (
                        <p className="text-muted-foreground text-center py-4">
                            No activity yet. Make a purchase to start earning!
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {transactions?.map((tx) => (
                                <div
                                    key={tx.id}
                                    className="flex items-center justify-between py-2 border-b last:border-0"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${tx.points > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                            }`}>
                                            {tx.points > 0 ? <Zap className="h-4 w-4" /> : <Gift className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{tx.description}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {format(new Date(tx.created_at), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-semibold ${tx.points > 0 ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                        {tx.points > 0 ? '+' : ''}{tx.points} pts
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
