import { describe, it, expect } from 'vitest'

// Helper to determine badge logic without rendering full component
// mirroring the logic in ProductCard.tsx
function getProductBadges(product: any) {
    const isSoldOut = product.stock_quantity === 0
    const isLowStock = product.stock_quantity > 0 && product.stock_quantity < 5
    const hasDiscount = product.compare_at_price && product.compare_at_price > product.price

    const badges = []

    if (isSoldOut) badges.push('Sold Out')
    else {
        if (product.is_bestseller) badges.push('Best Seller')
        if (product.is_new) badges.push('New')
        if (hasDiscount) badges.push('Sale')
        if (isLowStock) badges.push('Low Stock')
    }

    return badges
}

describe('Product Badge Logic', () => {
    it('shows Sold Out badge when stock is 0', () => {
        const product = { stock_quantity: 0, is_bestseller: true, is_new: true }
        // Should ONLY show Sold Out, overriding others
        expect(getProductBadges(product)).toEqual(['Sold Out'])
    })

    it('shows Best Seller and New when in stock', () => {
        const product = { stock_quantity: 10, is_bestseller: true, is_new: true }
        expect(getProductBadges(product)).toContain('Best Seller')
        expect(getProductBadges(product)).toContain('New')
    })

    it('shows Low Stock warning when stock < 5', () => {
        const product = { stock_quantity: 3 }
        expect(getProductBadges(product)).toContain('Low Stock')
    })

    it('shows Sale badge when discounted', () => {
        const product = { stock_quantity: 10, price: 10, compare_at_price: 15 }
        expect(getProductBadges(product)).toContain('Sale')
    })

    it('does not show Sale badge if sold out', () => {
        const product = { stock_quantity: 0, price: 10, compare_at_price: 15 }
        expect(getProductBadges(product)).toEqual(['Sold Out'])
    })
})
