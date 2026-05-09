/**
 * Review API client
 */

import type { Review, ReviewCreate, ReviewListResponse, ReviewUpdate } from "../types/review";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("token");
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

export const reviewApi = {
  async getProductReviews(
    productId: number,
    page: number = 1,
    perPage: number = 10,
  ): Promise<ReviewListResponse> {
    const response = await fetch(
      `${API_BASE_URL}/reviews/product/${productId}?page=${page}&per_page=${perPage}`,
    );
    if (!response.ok) throw new Error("Failed to fetch reviews");
    return response.json();
  },

  async createReview(data: ReviewCreate): Promise<Review> {
    const response = await fetch(`${API_BASE_URL}/reviews/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create review");
    return response.json();
  },

  async updateReview(id: number, data: ReviewUpdate): Promise<Review> {
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to update review");
    return response.json();
  },

  async deleteReview(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!response.ok) throw new Error("Failed to delete review");
  },

  async getRecentReviews(limit: number = 5): Promise<Review[]> {
    const response = await fetch(`${API_BASE_URL}/reviews/recent?limit=${limit}`);
    if (!response.ok) throw new Error("Failed to fetch recent reviews");
    return response.json();
  },
};
