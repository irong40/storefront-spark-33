import React from 'react'
import { render } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthContext } from '@/contexts/AuthContext'
import { CartContext } from '@/contexts/CartContext'
import { vi } from 'vitest'

// Create mock contexts
export const createMockAuthContext = (overrides = {}) => ({
    user: null,
    profile: null,
    session: null,
    isLoading: false,
    signUp: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
    updateProfile: vi.fn(),
    resetPassword: vi.fn(),
    ...overrides,
})

export const createMockCartContext = (overrides = {}) => ({
    items: [],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    subtotal: 0,
    isOpen: false,
    setIsOpen: vi.fn(),
    ...overrides,
})

interface ProvidersProps {
    children: React.ReactNode
    authContext?: ReturnType<typeof createMockAuthContext>
    cartContext?: ReturnType<typeof createMockCartContext>
    initialRoute?: string
}

export function TestProviders({
    children,
    authContext = createMockAuthContext(),
    cartContext = createMockCartContext(),
    initialRoute = '/',
}: ProvidersProps) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    })

    return (
        <QueryClientProvider client={queryClient}>
            <AuthContext.Provider value={authContext}>
                <CartContext.Provider value={cartContext}>
                    <MemoryRouter initialEntries={[initialRoute]}>
                        {children}
                    </MemoryRouter>
                </CartContext.Provider>
            </AuthContext.Provider>
        </QueryClientProvider>
    )
}

export function renderWithProviders(
    ui: React.ReactElement,
    options: Omit<ProvidersProps, 'children'> = {}
) {
    return render(ui, {
        wrapper: ({ children }) => (
            <TestProviders {...options}>{children}</TestProviders>
        ),
    })
}
