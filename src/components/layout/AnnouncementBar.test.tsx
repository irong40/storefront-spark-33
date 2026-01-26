import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AnnouncementBar } from '@/components/layout/AnnouncementBar'

describe('AnnouncementBar', () => {
    beforeEach(() => {
        localStorage.clear()
        // Default to real timers to avoid timeouts on async operations
        vi.useRealTimers()
    })

    it('renders correctly when not dismissed', () => {
        render(<AnnouncementBar />)
        expect(screen.getByText(/free shipping/i)).toBeInTheDocument()
    })

    it('hides when dismissed', async () => {
        render(<AnnouncementBar />)

        const closeButton = screen.getByRole('button', { name: /dismiss/i })
        fireEvent.click(closeButton)

        await waitFor(() => {
            expect(screen.queryByText(/free shipping/i)).not.toBeInTheDocument()
        })
    })

    it('persists dismissal in localStorage', () => {
        render(<AnnouncementBar />)

        const closeButton = screen.getByRole('button', { name: /dismiss/i })
        fireEvent.click(closeButton)

        expect(localStorage.getItem('announcement-dismissed-timestamp')).toBeTruthy()
    })

    describe('Time-dependent behavior', () => {
        beforeEach(() => {
            vi.useFakeTimers()
            vi.setSystemTime(new Date('2026-01-26T12:00:00Z'))
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('reappears after 24 hours', () => {
            // Simulate dismissed 25 hours ago
            const now = new Date('2026-01-26T12:00:00Z').getTime()
            const twentyFiveHoursAgo = now - (25 * 60 * 60 * 1000)
            localStorage.setItem('announcement-dismissed-timestamp', twentyFiveHoursAgo.toString())

            render(<AnnouncementBar />)
            expect(screen.getByText(/free shipping/i)).toBeInTheDocument()
        })

        it('stays hidden if less than 24 hours', () => {
            // Simulate dismissed 23 hours ago
            const now = new Date('2026-01-26T12:00:00Z').getTime()
            const twentyThreeHoursAgo = now - (23 * 60 * 60 * 1000)
            localStorage.setItem('announcement-dismissed-timestamp', twentyThreeHoursAgo.toString())

            render(<AnnouncementBar />)
            expect(screen.queryByText(/free shipping/i)).not.toBeInTheDocument()
        })
    })
})
