import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, RefreshCw, Users, ArrowRight } from 'lucide-react';

interface Referral {
    id: string;
    referrer_email: string; // derived
    referee_email: string | null;
    status: string;
    created_at: string;
    order_total: number | null; // derived from order
}

export function ReferralsTable() {
    const [loading, setLoading] = useState(true);
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [search, setSearch] = useState('');

    const fetchReferrals = async () => {
        setLoading(true);

        // We need to join loyalty_members -> auth.users methods? 
        // Supabase JS plain client doesn't do deep nested joins easily on auth schema.
        // So we fetch referrals, then fetch related data if needed.
        // Or create a View. For now, simple fetch.

        const { data, error } = await supabase
            .from('referrals')
            .select(`
        id,
        status,
        created_at,
        referee_email,
        referrer:referrer_id (
           user_id
        ),
        order:order_id (
           total
        )
      `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching referrals:', error);
            setLoading(false);
            return;
        }

        // Now resolve user emails. This is N+1 but safe for small admin usage.
        // Better: Edge Function or View.
        // Let's settle for simple mapping if we can't join auth.users directly via Client.
        // But wait, `loyalty_members` is public. We can't see `auth.users.email` from public client?
        // We are Admin, maybe we can if RLS allows?
        // Actually, `loyalty_members` table does NOT have email.
        // We need a way to get email.
        // Let's assume for MVP we might show ID or just count.
        // OR create a helper function `get_referral_details`.

        // I'll create a View for this later if needed. For now, let's try to grab emails via RPC if existing? 
        // Or just display "Referrer #ID".

        // Actually, `orders` has email! And `referrals` links to `orders`.
        // If completed, we have referee email from order.
        // Referrer email is harder.

        // Let's build a simpler table first.

        interface ReferralJoinResult {
            id: string;
            referrer_id: string;
            referee_email: string | null;
            status: string;
            created_at: string;
            referrer: { user_id: string } | null;
            order: { total: number } | null;
        }

        const formatted = (data as unknown as ReferralJoinResult[]).map((r) => ({
            id: r.id,
            referrer_email: r.referrer?.user_id || 'Unknown', // Placeholder
            referee_email: r.referee_email || (r.order ? 'From Order' : 'Pending'),
            status: r.status,
            created_at: r.created_at,
            order_total: r.order?.total || 0
        }));

        setReferrals(formatted);
        setLoading(false);
    };

    useEffect(() => {
        fetchReferrals();
    }, []);

    const filtered = referrals.filter(r =>
        r.status.includes(search.toLowerCase()) ||
        r.referrer_email.includes(search)
    );

    if (loading) return <Skeleton className="h-48 w-full" />;

    return (
        <div className="space-y-4">
            <div className="flex justify-between">
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search referrals..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-8"
                    />
                </div>
                <Button variant="outline" onClick={fetchReferrals}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Referrer</TableHead>
                            <TableHead>Referee</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Order Value</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    No referrals found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((referral) => (
                                <TableRow key={referral.id}>
                                    <TableCell>
                                        {format(new Date(referral.created_at), 'MMM d, yyyy')}
                                    </TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">
                                        {referral.referrer_email.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell>
                                        {referral.referee_email === 'From Order' ? <span className="text-muted-foreground italic">Linked to Order</span> : referral.referee_email}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={referral.status === 'completed' ? 'default' : 'outline'}>
                                            {referral.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {referral.order_total ? `$${referral.order_total.toFixed(2)}` : '-'}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
