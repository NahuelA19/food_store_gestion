import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';
import '@testing-library/jest-dom';

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

describe('App', () => {
  it('renders navigation with logo', () => {
    render(<App />);
    expect(screen.getByText('🍕 Food Store')).toBeInTheDocument();
  });

  it('renders home page content', () => {
    render(<App />);
    expect(screen.getByText('Bienvenido a Food Store')).toBeInTheDocument();
  });
});
