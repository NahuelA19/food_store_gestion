/**
 * ReviewCard — Single review display component
 */

import { StarRating } from "./StarRating";
import type { Review } from "../../types/review";

interface ReviewCardProps {
  review: Review;
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return date.toLocaleDateString();
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="glass rounded-xl border border-border p-4 transition-colors">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-brand-100)] text-sm font-bold text-[color:var(--color-brand-700)] dark:bg-brand-900 dark:text-brand-300">
            {review.user_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">
              {review.user_name}
            </p>
            <p className="text-xs text-text-muted">
              {formatRelativeDate(review.created_at)}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {review.title && (
        <h4 className="mb-1 font-semibold text-text-primary">{review.title}</h4>
      )}

      {review.comment && (
        <p className="text-sm leading-relaxed text-text-secondary">
          {review.comment}
        </p>
      )}
    </div>
  );
}
