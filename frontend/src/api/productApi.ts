/**
 * Product and Inventory API client
 */

import {
  Category,
  CreateCategoryPayload,
  CreateProductPayload,
  Inventory,
  Product,
  ProductListResponse,
  UpdateCategoryPayload,
  UpdateProductPayload,
} from "../types/product";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api/v1";

export const productApi = {
  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_BASE_URL}/categories/`);
    if (!response.ok) throw new Error("Failed to fetch categories");
    return response.json();
  },

  async getCategory(id: number): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`);
    if (!response.ok) throw new Error("Failed to fetch category");
    return response.json();
  },

  async createCategory(payload: CreateCategoryPayload): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to create category");
    return response.json();
  },

  async updateCategory(id: number, payload: UpdateCategoryPayload): Promise<Category> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to update category");
    return response.json();
  },

  async deleteCategory(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/categories/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete category");
  },

  // Products
  async getProducts(
    page = 1,
    limit = 20,
    categoryId?: number,
    minPrice?: number,
    maxPrice?: number,
    inStock?: boolean,
    search?: string,
    sortBy = "created_at",
    order = "desc"
  ): Promise<ProductListResponse> {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
      sort_by: sortBy,
      order,
    });

    if (categoryId) params.append("category_id", String(categoryId));
    if (minPrice !== undefined) params.append("min_price", String(minPrice));
    if (maxPrice !== undefined) params.append("max_price", String(maxPrice));
    if (inStock !== undefined) params.append("in_stock", String(inStock));
    if (search) params.append("search", search);

    const response = await fetch(`${API_BASE_URL}/products/?${params}`);
    if (!response.ok) throw new Error("Failed to fetch products");
    return response.json();
  },

  async getProduct(id: number): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error("Failed to fetch product");
    return response.json();
  },

  async createProduct(payload: CreateProductPayload): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to create product");
    return response.json();
  },

  async updateProduct(id: number, payload: UpdateProductPayload): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Failed to update product");
    return response.json();
  },

  async deleteProduct(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete product");
  },

  async getRelatedProducts(id: number, limit = 4): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products/${id}/related?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch related products");
    return response.json();
  },

  async toggleAvailability(id: number): Promise<Product> {
    const response = await fetch(`${API_BASE_URL}/products/${id}/availability`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) throw new Error("Failed to toggle availability");
    return response.json();
  },

  async getFrequentlyBoughtTogether(id: number, limit = 4): Promise<Product[]> {
    const response = await fetch(`${API_BASE_URL}/products/${id}/frequently-bought?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch frequently bought together");
    return response.json();
  },

  // Inventory
  async getInventory(productId: number): Promise<Inventory> {
    const response = await fetch(`${API_BASE_URL}/inventory/${productId}`);
    if (!response.ok) throw new Error("Failed to fetch inventory");
    return response.json();
  },

  async updateInventory(
    productId: number,
    stockQuantity: number,
    lowStockThreshold = 10
  ): Promise<Inventory> {
    const response = await fetch(`${API_BASE_URL}/inventory/${productId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stock_quantity: stockQuantity,
        low_stock_threshold: lowStockThreshold,
      }),
    });
    if (!response.ok) throw new Error("Failed to update inventory");
    return response.json();
  },

  async reserveInventory(productId: number, quantity: number): Promise<Inventory> {
    const response = await fetch(`${API_BASE_URL}/inventory/${productId}/reserve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error("Failed to reserve inventory");
    return response.json();
  },
};
