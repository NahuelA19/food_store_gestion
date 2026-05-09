/**
 * FavoriteButton — Heart icon toggle for wishlist
 */

import { useState } from "react";
import { Heart } from "lucide-react";

interface FavoriteButtonProps {
  isWishlisted: boolean;
  onToggle: () => Promise<boolean>;
  size?: "sm" | "md" | "lg";
}

const sizeMap = {
  sm: 16,
  md: 20,
  lg: 24,
};

export function FavoriteButton({
  isWishlisted,
  onToggle,
  size = "md",
}: FavoriteButtonProps) {
  const [loading, setLoading] = useState(false);
  const iconSize = sizeMap[size];

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await onToggle();
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-full p-1.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
        loading ? "animate-pulse" : "hover:scale-110"
      } ${isWishlisted ? "text-red-500" : "text-gray-400 hover:text-red-400 dark:text-gray-500"}`}
      aria-label={isWishlisted ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        size={iconSize}
        className={`transition-all duration-200 ${
          isWishlisted ? "fill-red-500" : "fill-none"
        }`}
      />
    </button>
  );
}
