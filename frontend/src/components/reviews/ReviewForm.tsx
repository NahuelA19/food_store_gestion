/**
 * ReviewForm — Create/edit/delete review form
 */

import { useState } from "react";
import { StarRating } from "./StarRating";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Star, Loader2, Trash2, Edit3 } from "lucide-react";
import { useCreateReview, useUpdateReview, useDeleteReview } from "../../hooks/useReviews";
import type { Review } from "../../types/review";

interface ReviewFormProps {
  productId: number;
  existingReview?: Review | null;
  onSubmit?: () => void;
  onDelete?: () => void;
}

export function ReviewForm({ productId, existingReview, onSubmit, onDelete }: ReviewFormProps) {
  const isEditing = !!existingReview;

  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [title, setTitle] = useState(existingReview?.title ?? "");
  const [comment, setComment] = useState(existingReview?.comment ?? "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { createReview, isLoading: isCreating, error: createError } = useCreateReview();
  const { updateReview, isLoading: isUpdating, error: updateError } = useUpdateReview();
  const { deleteReview, isLoading: isDeleting, error: deleteError } = useDeleteReview();

  const isLoading = isCreating || isUpdating || isDeleting;
  const error = createError || updateError || deleteError;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;

    let result: Review | null;

    if (isEditing && existingReview) {
      result = await updateReview(existingReview.id, {
        rating,
        title: title || undefined,
        comment: comment || undefined,
      }, productId);
    } else {
      result = await createReview({
        product_id: productId,
        rating,
        title: title || undefined,
        comment: comment || undefined,
      });
    }

    if (result) {
      setRating(0);
      setTitle("");
      setComment("");
      onSubmit?.();
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    const ok = await deleteReview(existingReview.id, productId);
    if (ok) {
      setShowDeleteConfirm(false);
      onDelete?.();
    }
  };

  const isValid = rating > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {isEditing && (
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-600 dark:text-brand-400">
          <Icon icon={Edit3} size={16} />
          Editing your review
        </div>
      )}

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          type="submit"
          variant="default"
          disabled={!isValid || isLoading}
          className="w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Icon icon={Loader2} size={16} className="animate-spin" />
              {isEditing ? "Updating..." : "Submitting..."}
            </>
          ) : (
            <>
              <Icon icon={Star} size={16} />
              {isEditing ? "Update Review" : "Submit Review"}
            </>
          )}
        </Button>

        {isEditing && !showDeleteConfirm && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full sm:w-auto"
          >
            <Icon icon={Trash2} size={16} />
            Delete Review
          </Button>
        )}

        {isEditing && showDeleteConfirm && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-sm text-text-muted">Are you sure?</span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                size="sm"
              >
                {isDeleting ? (
                  <Icon icon={Loader2} size={16} className="animate-spin" />
                ) : (
                  "Yes, delete"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                size="sm"
                disabled={isDeleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
