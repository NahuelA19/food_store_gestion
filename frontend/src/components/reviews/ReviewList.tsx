/**
 * ReviewList — Paginated review list with summary header
 */

import { Star, MessageSquare } from "lucide-react";
import { ReviewCard } from "./ReviewCard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Review } from "../../types/review";

interface ReviewSummary {
  average_rating: number | null;
  total_count: number;
  distribution: Record<number, number>;
}

interface ReviewListProps {
  reviews: Review[];
  summary: ReviewSummary;
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function ReviewSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface-alt p-4"
        >
          <div className="mb-3 flex items-center gap-3">
            <Skeleton variant="circle" className="h-8 w-8" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <Skeleton className="mb-2 h-4 w-3/4" />
          <Skeleton className="h-12 w-full" />
        </div>
      ))}
    </div>
  );
}

export function ReviewList({
  reviews,
  summary,
  isLoading,
  page,
  totalPages,
  onPageChange,
}: ReviewListProps) {
  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <ReviewSkeleton />
      </div>
    );
  }

  const hasReviews = reviews.length > 0;

  return (
    <div>
      {/* Summary Header */}
      <div className="mb-6">
        <h3 className="mb-2 font-display text-xl font-bold text-text-primary">
          Customer Reviews
        </h3>
        {summary.total_count > 0 && summary.average_rating !== null ? (
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-display text-3xl font-black text-text-primary">
                {summary.average_rating.toFixed(1)}
              </span>
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Math.round(summary.average_rating!)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-none text-gray-300 dark:text-gray-600"
                    }
                  />
                ))}
              </div>
            </div>
            <span className="text-sm text-text-muted">
              Based on {summary.total_count}{" "}
              {summary.total_count === 1 ? "review" : "reviews"}
            </span>

            {/* Distribution bars */}
            <div className="ml-auto space-y-1">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = summary.distribution[star] ?? 0;
                const pct =
                  summary.total_count > 0
                    ? (count / summary.total_count) * 100
                    : 0;
                return (
                  <div key={star} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-right text-text-muted">
                      {star}
                    </span>
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-border-light dark:bg-border-dark">
                      <div
                        className="h-full rounded-full bg-amber-400 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-4 text-text-muted">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <p className="text-text-muted">No reviews yet</p>
        )}
      </div>

      {/* Reviews List */}
      {hasReviews ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <MessageSquare size={48} className="text-gray-300 dark:text-gray-600" />
          <p className="text-text-muted">
            No reviews yet. Be the first to review this product!
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            Previous
          </Button>
          <span className="px-4 text-sm text-text-muted">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
