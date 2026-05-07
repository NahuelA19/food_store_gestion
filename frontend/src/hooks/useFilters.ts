/**
 * useFilters hook - Manage product filters and search state
 */

import { useState } from "react";

export function useFilters() {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [minPrice, setMinPrice] = useState<number | null>(null);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("created_at");
  const [order, setOrder] = useState<"asc" | "desc">("desc");

  const resetFilters = () => {
    setSelectedCategory(null);
    setSearchQuery("");
    setMinPrice(null);
    setMaxPrice(null);
    setSortBy("created_at");
    setOrder("desc");
  };

  return {
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    minPrice,
    setMinPrice,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    order,
    setOrder,
    resetFilters,
  };
}
