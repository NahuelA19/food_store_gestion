import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../App';
import '@testing-library/jest-dom';

describe('App', () => {
  it('renders main heading', () => {
    render(<App />);
    expect(screen.getByText(/🍕 Food Store/i)).toBeInTheDocument();
  });

  it('displays welcome message', () => {
    render(<App />);
    expect(screen.getByText(/welcome to food store/i)).toBeInTheDocument();
  });
});
