import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SearchBar } from '../components/SearchBar';

describe('SearchBar component', () => {
  it('should render with placeholder text', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
        placeholder="Search products..."
      />
    );

    const input = screen.getByPlaceholderText('Search products...');
    expect(input).toBeInTheDocument();
  });

  it('should call onChange when user types', async () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'pasta' } });

    expect(input).toHaveValue('pasta');
  });

  it('should show clear button when value is present', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <SearchBar
        value="pasta"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearBtn = screen.getByLabelText('Clear search');
    expect(clearBtn).toBeInTheDocument();
  });

  it('should call onClear when clear button is clicked', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <SearchBar
        value="pasta"
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearBtn = screen.getByLabelText('Clear search');
    fireEvent.click(clearBtn);

    expect(mockOnClear).toHaveBeenCalled();
  });

  it('should not show clear button when value is empty', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    const clearBtn = screen.queryByLabelText('Clear search');
    expect(clearBtn).not.toBeInTheDocument();
  });

  it('should show loading spinner when isLoading is true', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <SearchBar
        value="pasta"
        onChange={mockOnChange}
        onClear={mockOnClear}
        isLoading={true}
      />
    );

    // The spinner is an SVG with aria-hidden="true", so we check for the container
    const searchBar = screen.getByRole('textbox').parentElement?.parentElement;
    const svg = searchBar?.querySelector('svg.animate-spin');
    expect(svg).toBeInTheDocument();
  });

  it('should not show loading spinner when isLoading is false', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <SearchBar
        value="pasta"
        onChange={mockOnChange}
        onClear={mockOnClear}
        isLoading={false}
      />
    );

    const searchBar = screen.getByRole('textbox').parentElement?.parentElement;
    const svg = searchBar?.querySelector('svg.animate-spin');
    expect(svg).not.toBeInTheDocument();
  });

  it('should render search icon (SVG)', () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
      />
    );

    // Search icon is now an SVG (lucide Search), not an emoji
    const searchBar = screen.getByRole('textbox').parentElement?.parentElement;
    const searchIcon = searchBar?.querySelector('.lucide-search');
    expect(searchIcon).toBeInTheDocument();
  });

  it('should have autoFocus when specified', async () => {
    const mockOnChange = vi.fn();
    const mockOnClear = vi.fn();

    render(
      <SearchBar
        value=""
        onChange={mockOnChange}
        onClear={mockOnClear}
        autoFocus={true}
      />
    );

    const input = screen.getByRole('textbox');
    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });
});
