// Loyalty feature hooks - stubbed until database tables are created
// TODO: Create loyalty_members, loyalty_transactions, loyalty_rewards, loyalty_redemptions tables

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

// Stub hooks - return empty/null data until loyalty tables are created

export function useLoyaltyMember() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['loyalty-member', user?.id],
    queryFn: async (): Promise<LoyaltyMember | null> => {
      // TODO: Implement when loyalty_members table exists
      return null;
    },
    enabled: !!user,
  });
}

export function useLoyaltyTransactions(_limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['loyalty-transactions', user?.id],
    queryFn: async (): Promise<LoyaltyTransaction[]> => {
      // TODO: Implement when loyalty_transactions table exists
      return [];
    },
    enabled: !!user,
  });
}

export function useLoyaltyRewards() {
  return useQuery({
    queryKey: ['loyalty-rewards'],
    queryFn: async (): Promise<LoyaltyReward[]> => {
      // TODO: Implement when loyalty_rewards table exists
      return [];
    },
  });
}

export function useLoyaltyRedemptions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['loyalty-redemptions', user?.id],
    queryFn: async (): Promise<LoyaltyRedemption[]> => {
      // TODO: Implement when loyalty_redemptions table exists
      return [];
    },
    enabled: !!user,
  });
}

export function useRedeemReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_rewardId: string): Promise<{ code: string }> => {
      // TODO: Implement when loyalty tables exist
      throw new Error('Loyalty feature coming soon!');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['loyalty-member'] });
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
  if (lifetimePoints >= 1000) return null;
  if (lifetimePoints >= 500) return { nextTier: 'Platinum', pointsNeeded: 1000 - lifetimePoints };
  if (lifetimePoints >= 200) return { nextTier: 'Gold', pointsNeeded: 500 - lifetimePoints };
  return { nextTier: 'Silver', pointsNeeded: 200 - lifetimePoints };
}
