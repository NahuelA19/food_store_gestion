/**
 * Review TypeScript interfaces
 */

export interface Review {
  id: number;
  product_id: number;
  user_id: number;
  user_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReviewSummary {
  average_rating: number | null;
  total_count: number;
  distribution: Record<number, number>;
}

export interface ReviewCreate {
  product_id: number;
  rating: number;
  title?: string;
  comment?: string;
}

export interface ReviewUpdate {
  rating?: number;
  title?: string;
  comment?: string;
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  page: number;
  per_page: number;
  average_rating: number | null;
  total_reviews: number;
}
