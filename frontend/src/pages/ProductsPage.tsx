/**
 * ProductsPage - Main product browsing page with filters and grid
 */

import React, { useState } from "react";
import { CategoryFilter } from "../components/CategoryFilter";
import { Pagination } from "../components/Pagination";
import { ProductGrid } from "../components/ProductGrid";
import { SearchInput } from "../components/SearchInput";
import { useFilters } from "../hooks/useFilters";
import { useProducts } from "../hooks/useProducts";

export const ProductsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { selectedCategory, setSelectedCategory, searchQuery, setSearchQuery } =
    useFilters();

  const { products, total, totalPages, isLoading, error } = useProducts(
    page,
    selectedCategory || undefined,
    searchQuery
  );

  const handleCategoryChange = (categoryId: number | null) => {
    setSelectedCategory(categoryId);
    setPage(1);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="products-page">
      <header className="page-header">
        <h1>Products</h1>
        <p>Browse our collection of fresh food products</p>
      </header>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="category-filter">Category:</label>
          <CategoryFilter
            selectedCategory={selectedCategory}
            onFilterChange={handleCategoryChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="search-input">Search:</label>
          <SearchInput onSearch={handleSearch} />
        </div>
      </div>

      {/* Results Info */}
      <div className="results-info">
        <p>
          Showing <strong>{products.length}</strong> of <strong>{total}</strong>{" "}
          products
        </p>
      </div>

      {/* Product Grid */}
      <ProductGrid
        products={products}
        isLoading={isLoading}
        error={error}
        onAddToCart={(product, quantity) => {
          console.log(`Added ${quantity} of ${product.name} to cart`);
          // TODO: Integrate with cart context/state
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          hasNext={page < totalPages}
          hasPrevious={page > 1}
        />
      )}

      <style>{`
        .products-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 16px;
        }

        .page-header {
          text-align: center;
          margin-bottom: 32px;
          padding: 32px 0;
          border-bottom: 2px solid #f0f0f0;
        }

        .page-header h1 {
          margin: 0 0 8px;
          font-size: 32px;
        }

        .page-header p {
          margin: 0;
          color: #666;
          font-size: 16px;
        }

        .filters-section {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .filter-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
          min-width: 150px;
        }

        .filter-group label {
          font-size: 12px;
          font-weight: 600;
          color: #666;
          text-transform: uppercase;
        }

        .results-info {
          margin-bottom: 16px;
          color: #666;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .products-page {
            padding: 0 12px;
          }

          .page-header {
            margin-bottom: 24px;
            padding: 24px 0;
          }

          .page-header h1 {
            font-size: 24px;
          }

          .filters-section {
            flex-direction: column;
          }

          .filter-group {
            min-width: unset;
          }
        }
      `}</style>
    </div>
  );
};
