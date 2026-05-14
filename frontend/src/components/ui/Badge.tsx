/**
 * Badge — Inline status indicator with color variants
 */

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors whitespace-nowrap",
  {
    variants: {
      variant: {
        success: "bg-success/20 border border-success/50 text-white backdrop-blur-sm shadow-sm",
        warning: "bg-warning/20 border border-warning/50 text-white backdrop-blur-sm shadow-sm",
        danger: "bg-danger/20 border border-danger/50 text-white backdrop-blur-sm shadow-sm",
        info: "bg-info/20 border border-info/50 text-white backdrop-blur-sm shadow-sm",
        neutral: "bg-surface-alt border border-border text-white backdrop-blur-sm shadow-sm",
        brand: "bg-brand-500/20 border border-brand-500/50 text-white backdrop-blur-sm shadow-sm",
        /* Semantic order states with design system tokens */
        pending: "bg-pending/20 border border-pending/50 text-white font-semibold backdrop-blur-sm shadow-sm",
        confirmed: "bg-confirmed/20 border border-confirmed/50 text-white font-semibold backdrop-blur-sm shadow-sm",
        preparing: "bg-preparing/20 border border-preparing/50 text-white font-semibold backdrop-blur-sm shadow-sm",
      },
      size: {
        default: "text-xs px-2.5 py-0.5",
        sm: "text-[10px] px-2 py-0.5",
        lg: "text-sm px-3 py-1",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    />
  );
}
