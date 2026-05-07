/**
 * Pagination component - Navigate between product pages
 */

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  hasNext,
  hasPrevious,
}) => {
  return (
    <div className="pagination">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={!hasPrevious}
        aria-label="Previous page"
      >
        ← Previous
      </button>

      <div className="page-info">
        Page {currentPage} of {totalPages}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={!hasNext}
        aria-label="Next page"
      >
        Next →
      </button>

      <style>{`
        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 24px;
          padding: 16px 0;
        }

        .pagination button {
          padding: 8px 16px;
          background: #2c3e50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: background 0.2s;
        }

        .pagination button:hover:not(:disabled) {
          background: #1a252f;
        }

        .pagination button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 14px;
          color: #666;
          min-width: 150px;
          text-align: center;
        }

        @media (max-width: 480px) {
          .pagination {
            flex-direction: column;
            gap: 8px;
          }

          .pagination button {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};
