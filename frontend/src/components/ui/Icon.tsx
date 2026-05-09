/**
 * Icon — Wrapper for lucide-react icons with consistent sizing
 *
 * Usage:
 *   <Icon icon={ShoppingCart} />
 *   <Icon icon={User} size={24} className="text-brand" />
 */

import { type LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconProps {
  icon: React.ComponentType<LucideProps>;
  size?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

export function Icon({
  icon: LucideIcon,
  size = 20,
  className,
  "aria-hidden": ariaHidden = true,
  ...props
}: IconProps) {
  return (
    <LucideIcon
      size={size}
      className={cn("shrink-0", className)}
      aria-hidden={ariaHidden}
      {...props}
    />
  );
}

/**
 * Convenience — Common icon sizes as constants
 */
export const IconSize = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  "2xl": 40,
} as const;
