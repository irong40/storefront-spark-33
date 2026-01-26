import { describe, it, expect } from 'vitest'

/**
 * Utility functions for discount calculations
 * These mirror the logic used in Checkout.tsx
 */

// Calculate loyalty discount based on reward type
export function calculateLoyaltyDiscount(
    rewardType: string,
    rewardValue: number,
    orderTotal: number,
    shipping: number
): number {
    if (rewardType === 'discount_fixed') {
        return Math.min(rewardValue, orderTotal)
    } else if (rewardType === 'discount_percent') {
        return (orderTotal * rewardValue) / 100
    } else if (rewardType === 'free_shipping') {
        return shipping
    }
    return 0
}

// Calculate final total after all discounts
export function calculateFinalTotal(
    orderTotal: number,
    giftCardAmount: number,
    loyaltyDiscount: number
): number {
    return Math.max(0, orderTotal - giftCardAmount - loyaltyDiscount)
}

// Calculate points earned from order
export function calculatePointsEarned(
    orderTotal: number,
    giftCardAmount: number
): number {
    const cashSpent = orderTotal - giftCardAmount
    return cashSpent > 0 ? Math.floor(cashSpent) : 0
}

describe('Discount Calculations', () => {
    describe('calculateLoyaltyDiscount', () => {
        it('calculates fixed discount correctly', () => {
            expect(calculateLoyaltyDiscount('discount_fixed', 5, 50, 5.99)).toBe(5)
        })

        it('caps fixed discount at order total', () => {
            expect(calculateLoyaltyDiscount('discount_fixed', 50, 30, 5.99)).toBe(30)
        })

        it('calculates percentage discount correctly', () => {
            expect(calculateLoyaltyDiscount('discount_percent', 15, 100, 5.99)).toBe(15)
        })

        it('calculates 10% on $45.50', () => {
            expect(calculateLoyaltyDiscount('discount_percent', 10, 45.50, 5.99)).toBe(4.55)
        })

        it('returns shipping amount for free_shipping', () => {
            expect(calculateLoyaltyDiscount('free_shipping', 0, 100, 5.99)).toBe(5.99)
        })

        it('returns 0 for unknown reward type', () => {
            expect(calculateLoyaltyDiscount('unknown', 10, 100, 5.99)).toBe(0)
        })
    })

    describe('calculateFinalTotal', () => {
        it('subtracts gift card from total', () => {
            expect(calculateFinalTotal(100, 20, 0)).toBe(80)
        })

        it('subtracts loyalty discount from total', () => {
            expect(calculateFinalTotal(100, 0, 15)).toBe(85)
        })

        it('subtracts both discounts', () => {
            expect(calculateFinalTotal(100, 20, 10)).toBe(70)
        })

        it('never goes below zero', () => {
            expect(calculateFinalTotal(50, 30, 30)).toBe(0)
        })

        it('handles fractional amounts', () => {
            expect(calculateFinalTotal(45.99, 10.50, 5)).toBeCloseTo(30.49, 2)
        })
    })

    describe('calculatePointsEarned', () => {
        it('gives 1 point per dollar', () => {
            expect(calculatePointsEarned(100, 0)).toBe(100)
        })

        it('excludes gift card amount from points', () => {
            expect(calculatePointsEarned(100, 40)).toBe(60)
        })

        it('floors fractional amounts', () => {
            expect(calculatePointsEarned(45.99, 0)).toBe(45)
        })

        it('returns 0 if gift card covers entire order', () => {
            expect(calculatePointsEarned(50, 60)).toBe(0)
        })

        it('returns 0 if order total equals gift card', () => {
            expect(calculatePointsEarned(50, 50)).toBe(0)
        })
    })
})
