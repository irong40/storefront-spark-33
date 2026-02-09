import { useReferralStats, useTopReferrers } from '@/hooks/use-analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Users } from 'lucide-react';

export function ReferralStatsPanel() {
    const { data: stats, isLoading: statsLoading } = useReferralStats();
    const { data: topReferrers, isLoading: referrersLoading } = useTopReferrers(5);

    const isLoading = statsLoading || referrersLoading;

    if (isLoading) {
        return (
            <Card className="shadow-soft h-full">
                <CardHeader>
                    <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Referral Program
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-full" />
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (!stats) {
        return (
            <Card className="shadow-soft h-full">
                <CardHeader>
                    <CardTitle className="text-lg font-heading flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Referral Program
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="py-8 text-center text-muted-foreground">
                        <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>No referral data available</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="shadow-soft h-full">
            <CardHeader>
                <CardTitle className="text-lg font-heading flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Referral Program
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* KPI Summary */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-primary">{stats.totalReferrals}</p>
                        <p className="text-xs text-muted-foreground">Total Referrals</p>
                    </div>
                    <div className="text-center p-3 bg-muted/50 rounded-lg">
                        <p className="text-2xl font-bold text-accent">{stats.completedReferrals}</p>
                        <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                </div>

                {/* Conversion Rate */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Conversion Rate</span>
                        <span className="font-semibold">{stats.conversionRate.toFixed(1)}%</span>
                    </div>
                    <Progress value={stats.conversionRate} className="h-2" />
                </div>

                {/* Revenue from Referrals */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-olive-50 to-transparent rounded-lg">
                    <span className="text-sm text-muted-foreground">Referral Revenue</span>
                    <span className="font-semibold text-lg">${stats.referralRevenue.toFixed(2)}</span>
                </div>

                {/* Top Referrers Leaderboard */}
                {topReferrers && topReferrers.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                        <h4 className="text-sm font-medium flex items-center gap-1">
                            <Award className="h-4 w-4 text-yellow-500" />
                            Top Referrers
                        </h4>
                        <div className="space-y-2">
                            {topReferrers.slice(0, 3).map((referrer, index) => (
                                <div
                                    key={referrer.userId}
                                    className="flex items-center justify-between text-sm"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`
                      w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                      ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                index === 1 ? 'bg-gray-100 text-gray-600' :
                                                    'bg-amber-50 text-amber-600'}
                    `}>
                                            {index + 1}
                                        </span>
                                        <span className="text-muted-foreground truncate max-w-[100px]">
                                            {referrer.userId.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-medium">{referrer.referralCount}</span>
                                        <span className="text-muted-foreground text-xs ml-1">refs</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
