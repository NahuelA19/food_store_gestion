/**
 * ReviewForm — Create/edit review form
 */

import { useState } from "react";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Star, Loader2 } from "lucide-react";
import { useCreateReview } from "../../hooks/useReviews";

interface ReviewFormProps {
  productId: number;
  onSubmit?: () => void;
}

export function ReviewForm({ productId, onSubmit }: ReviewFormProps) {
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const { createReview, isLoading, error } = useCreateReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    const result = await createReview({
      product_id: productId,
      rating,
      title: title || undefined,
      comment: comment || undefined,
    });

    if (result) {
      setRating(0);
      setTitle("");
      setComment("");
      onSubmit?.();
    }
  };

  const isValid = rating > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-text-primary">
          Your Rating *
        </label>
        <StarRating rating={rating} interactive onRate={setRating} size="lg" />
      </div>

      <div>
        <label
          htmlFor="review-title"
          className="mb-1 block text-sm font-semibold text-text-primary"
        >
          Title (optional)
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summary of your review"
          maxLength={200}
          className="w-full rounded-xl border-2 border-border bg-surface-alt px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none dark:border-border dark:bg-surface"
        />
      </div>

      <div>
        <label
          htmlFor="review-comment"
          className="mb-1 block text-sm font-semibold text-text-primary"
        >
          Comment (optional)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others about your experience"
          rows={4}
          className="w-full resize-none rounded-xl border-2 border-border bg-surface-alt px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-500 focus:outline-none dark:border-border dark:bg-surface"
        />
      </div>

      {error && (
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      )}

      <Button
        type="submit"
        variant="default"
        disabled={!isValid || isLoading}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Icon icon={Loader2} size={16} className="animate-spin" />
            Submitting...
          </>
        ) : (
          <>
            <Icon icon={Star} size={16} />
            Submit Review
          </>
        )}
      </Button>
    </form>
  );
}
