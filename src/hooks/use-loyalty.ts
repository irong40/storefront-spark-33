import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface LoyaltyMember {
    id: string;
    user_id: string;
    points_balance: number;
    lifetime_points: number;
    tier: 'bronze' | 'silver' | 'gold' | 'platinum';
    joined_at: string;
}

export interface LoyaltyTransaction {
    id: string;
    member_id: string;
    type: 'earn' | 'redeem' | 'bonus' | 'expire' | 'adjustment';
    points: number;
    order_id: string | null;
    description: string;
    created_at: string;
}

export interface LoyaltyReward {
    id: string;
    name: string;
    description: string | null;
    points_required: number;
    reward_type: 'discount_percent' | 'discount_fixed' | 'free_product' | 'free_shipping';
    reward_value: number | null;
    product_id: string | null;
    min_order_amount: number;
    active: boolean;
}

export interface LoyaltyRedemption {
    id: string;
    member_id: string;
    reward_id: string;
    points_spent: number;
    code: string;
    status: 'active' | 'used' | 'expired';
    expires_at: string;
    reward?: LoyaltyReward;
}

// Get current user's loyalty member info
export function useLoyaltyMember() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['loyalty-member', user?.id],
        queryFn: async () => {
            if (!user) return null;

            const { data, error } = await supabase
                .from('loyalty_members')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // No member found
                throw error;
            }
            return data as LoyaltyMember;
        },
        enabled: !!user,
    });
}

// Get user's points transactions history
export function useLoyaltyTransactions(limit = 10) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['loyalty-transactions', user?.id, limit],
        queryFn: async () => {
            if (!user) return [];

            const { data: member } = await supabase
                .from('loyalty_members')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!member) return [];

            const { data, error } = await supabase
                .from('loyalty_transactions')
                .select('*')
                .eq('member_id', member.id)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data as LoyaltyTransaction[];
        },
        enabled: !!user,
    });
}

// Get available rewards
export function useLoyaltyRewards() {
    return useQuery({
        queryKey: ['loyalty-rewards'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('loyalty_rewards')
                .select('*')
                .eq('active', true)
                .order('points_required', { ascending: true });

            if (error) throw error;
            return data as LoyaltyReward[];
        },
    });
}

// Get user's active redemptions
export function useLoyaltyRedemptions() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['loyalty-redemptions', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data: member } = await supabase
                .from('loyalty_members')
                .select('id')
                .eq('user_id', user.id)
                .single();

            if (!member) return [];

            const { data, error } = await supabase
                .from('loyalty_redemptions')
                .select('*, reward:loyalty_rewards(*)')
                .eq('member_id', member.id)
                .eq('status', 'active')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as LoyaltyRedemption[];
        },
        enabled: !!user,
    });
}

// Redeem a reward
export function useRedeemReward() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (rewardId: string) => {
            if (!user) throw new Error('Must be logged in');

            // Get member and reward info
            const { data: member } = await supabase
                .from('loyalty_members')
                .select('id, points_balance')
                .eq('user_id', user.id)
                .single();

            if (!member) throw new Error('Not a loyalty member');

            const { data: reward } = await supabase
                .from('loyalty_rewards')
                .select('*')
                .eq('id', rewardId)
                .single();

            if (!reward) throw new Error('Reward not found');

            if (member.points_balance < reward.points_required) {
                throw new Error('Not enough points');
            }

            // Deduct points
            const { error: updateError } = await supabase
                .from('loyalty_members')
                .update({
                    points_balance: member.points_balance - reward.points_required,
                    updated_at: new Date().toISOString()
                })
                .eq('id', member.id);

            if (updateError) throw updateError;

            // Create transaction record
            const { error: txError } = await supabase
                .from('loyalty_transactions')
                .insert({
                    member_id: member.id,
                    type: 'redeem',
                    points: -reward.points_required,
                    description: `Redeemed: ${reward.name}`
                });

            if (txError) throw txError;

            // Create redemption
            const { data: redemption, error: redemptionError } = await supabase
                .from('loyalty_redemptions')
                .insert({
                    member_id: member.id,
                    reward_id: rewardId,
                    points_spent: reward.points_required
                })
                .select()
                .single();

            if (redemptionError) throw redemptionError;

            return redemption;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['loyalty-member'] });
            queryClient.invalidateQueries({ queryKey: ['loyalty-transactions'] });
            queryClient.invalidateQueries({ queryKey: ['loyalty-redemptions'] });
        },
    });
}

// Calculate tier based on lifetime points
export function getTier(lifetimePoints: number): LoyaltyMember['tier'] {
    if (lifetimePoints >= 1000) return 'platinum';
    if (lifetimePoints >= 500) return 'gold';
    if (lifetimePoints >= 200) return 'silver';
    return 'bronze';
}

// Get points to next tier
export function getPointsToNextTier(lifetimePoints: number): { nextTier: string; pointsNeeded: number } | null {
    if (lifetimePoints >= 1000) return null; // Already platinum
    if (lifetimePoints >= 500) return { nextTier: 'Platinum', pointsNeeded: 1000 - lifetimePoints };
    if (lifetimePoints >= 200) return { nextTier: 'Gold', pointsNeeded: 500 - lifetimePoints };
    return { nextTier: 'Silver', pointsNeeded: 200 - lifetimePoints };
}
