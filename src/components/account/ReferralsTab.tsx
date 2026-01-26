import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Copy, Gift, Users, Trophy } from 'lucide-react';

interface ReferralsTabProps {
    userId: string;
}

export function ReferralsTab({ userId }: ReferralsTabProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [referralCode, setReferralCode] = useState<string>('');
    const [stats, setStats] = useState({
        totalReferrals: 0,
        completedReferrals: 0,
        earnedPoints: 0
    });

    useEffect(() => {
        async function fetchData() {
            // 1. Get Loyalty Profile (Referral Code)
            const { data: memberData, error: memberError } = await supabase
                .from('loyalty_members')
                .select('id, referral_code, points_balance')
                .eq('user_id', userId)
                .single();

            if (memberError || !memberData) {
                console.error('Error fetching loyalty profile:', memberError);
                setLoading(false);
                return;
            }

            setReferralCode(memberData.referral_code || 'Generating...');

            // 2. Get Referral Stats
            const { data: referrals, error: refError } = await supabase
                .from('referrals')
                .select('status')
                .eq('referrer_id', memberData.id);

            if (!refError && referrals) {
                const completed = referrals.filter(r => r.status === 'completed').length;
                setStats({
                    totalReferrals: referrals.length,
                    completedReferrals: completed,
                    earnedPoints: completed * 50 // Assumes 50 pts per referral
                });
            }

            setLoading(false);
        }

        fetchData();
    }, [userId]);

    const copyToClipboard = () => {
        const link = `${window.location.origin}/?ref=${referralCode}`;
        navigator.clipboard.writeText(link);
        toast({
            title: 'Link Copied!',
            description: 'Share it with your friends to earn rewards.',
        });
    };

    if (loading) {
        return <Skeleton className="h-64 w-full rounded-2xl" />;
    }

    return (
        <div className="space-y-6">
            {/* Hero Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-8 text-center">
                <Gift className="h-12 w-12 mx-auto text-primary mb-4" />
                <h2 className="text-2xl font-display font-bold text-foreground mb-2">
                    Refer a Friend, Earn Rewards
                </h2>
                <p className="text-muted-foreground max-w-lg mx-auto mb-6">
                    Share your unique code with friends. They get <span className="font-semibold text-primary">$10 off</span> their first order,
                    and you get <span className="font-semibold text-primary">50 Loyalty Points</span> when they purchase!
                </p>

                <div className="max-w-sm mx-auto flex gap-2">
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                            <span className="text-muted-foreground text-sm font-medium">Code:</span>
                        </div>
                        <Input
                            value={referralCode}
                            readOnly
                            className="pl-14 text-center font-mono font-bold tracking-widest bg-white"
                        />
                    </div>
                    <Button onClick={copyToClipboard}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Link
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid sm:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Friends Invited</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Completed Referrals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-primary" />
                            <div className="text-2xl font-bold">{stats.completedReferrals}</div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Points Earned</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-primary" />
                            <div className="text-2xl font-bold">{stats.earnedPoints}</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* FAQs or Details could go here */}
            <Card>
                <CardHeader>
                    <CardTitle>How it works</CardTitle>
                    <CardDescription>Simple steps to earn rewards</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">1</div>
                        <div>
                            <p className="font-medium">Share your link</p>
                            <p className="text-sm text-muted-foreground">Send your unique referral link to friends who haven't ordered before.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">2</div>
                        <div>
                            <p className="font-medium">They get $10 off</p>
                            <p className="text-sm text-muted-foreground">Your friend uses your code at checkout to save on their first purchase.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">3</div>
                        <div>
                            <p className="font-medium">You get 50 Points</p>
                            <p className="text-sm text-muted-foreground">Once their order is completed, we automatically add points to your loyalty balance.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
