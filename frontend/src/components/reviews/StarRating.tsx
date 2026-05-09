/**
 * StarRating — Display or interactive star rating component
 */

import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  interactive?: boolean;
  onRate?: (rating: number) => void;
}

const sizeMap = {
  sm: 14,
  md: 20,
  lg: 28,
};

export function StarRating({
  rating,
  maxRating = 5,
  size = "md",
  interactive = false,
  onRate,
}: StarRatingProps) {
  const iconSize = sizeMap[size];

  if (interactive) {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= rating;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onRate?.(starValue)}
              className="rounded-sm p-0.5 transition-colors hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={`Rate ${starValue} star${starValue > 1 ? "s" : ""}`}
            >
              <Star
                size={iconSize}
                className={
                  isFilled
                    ? "fill-amber-400 text-amber-400"
                    : "fill-none text-gray-300 dark:text-gray-600"
                }
              />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const isFilled = starValue <= rating;
        return (
          <Star
            key={i}
            size={iconSize}
            className={
              isFilled
                ? "fill-amber-400 text-amber-400"
                : "fill-none text-gray-300 dark:text-gray-600"
            }
          />
        );
      })}
    </div>
  );
}
