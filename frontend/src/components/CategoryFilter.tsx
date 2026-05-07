/**
 * CategoryFilter component - Filter products by category
 */

import React, { useEffect, useState } from "react";
import { productApi } from "../api/productApi";
import { Category } from "../types/product";

interface CategoryFilterProps {
  selectedCategory: number | null;
  onFilterChange: (categoryId: number | null) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onFilterChange,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setIsLoading(true);
      try {
        const data = await productApi.getCategories();
        setCategories(data);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);

  return (
    <select
      value={selectedCategory || ""}
      onChange={(e) => onFilterChange(e.target.value ? parseInt(e.target.value) : null)}
      disabled={isLoading}
      style={{
        padding: "8px 12px",
        borderRadius: "4px",
        border: "1px solid #ddd",
        fontSize: "14px",
        cursor: "pointer",
      }}
    >
      <option value="">All Categories</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.name}
          {cat.product_count ? ` (${cat.product_count})` : ""}
        </option>
      ))}
    </select>
  );
};
