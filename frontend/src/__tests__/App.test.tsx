import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';
import '@testing-library/jest-dom';

// Mock ThemeContext
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
    isDark: false,
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock localStorage to return a valid token for authenticated state
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 1, email: 'test@example.com' },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  }),
}));

// Mock CartContext — Navigation renders CartBadge which uses useCartContext
vi.mock('../context/CartContext', () => ({
  useCartContext: () => ({
    cart: null,
    items: [],
    itemCount: 0,
    subtotal: 0,
    tax: 0,
    total: 0,
    isLoading: false,
    error: null,
    fetchCart: vi.fn(),
    addItem: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    checkout: vi.fn(),
  }),
  CartContext: {},
  CartProvider: ({ children }: { children: React.ReactNode }) => children,
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  TestWrapper.displayName = 'TestWrapper';
  return TestWrapper;
}

describe('App', () => {
  it('renders navigation with logo', () => {
    render(<App />, { wrapper: createWrapper() });
    expect(screen.getByText('Food Store')).toBeInTheDocument();
  });

  it('renders home page content', async () => {
    render(<App />, { wrapper: createWrapper() });
    expect(await screen.findByText('Panel de Control')).toBeInTheDocument();
  });
});
