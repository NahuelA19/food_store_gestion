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
        success: "bg-[color:var(--color-success-bg)] text-[color:var(--color-success-text)]",
        warning: "bg-[color:var(--color-warning-bg)] text-[color:var(--color-warning-text)]",
        danger: "bg-[color:var(--color-danger-bg)] text-[color:var(--color-danger-text)]",
        info: "bg-[color:var(--color-info-bg)] text-[color:var(--color-info-text)]",
        neutral: "bg-surface-alt text-text-secondary border border-border",
        brand: "bg-brand-100 text-brand-700",
        /* Semantic order states with design system tokens */
        pending: "bg-[color:var(--color-pending-bg)] text-[color:var(--color-pending-text)] font-semibold",
        confirmed: "bg-[color:var(--color-confirmed-bg)] text-[color:var(--color-confirmed-text)] font-semibold",
        preparing: "bg-[color:var(--color-preparing-bg)] text-[color:var(--color-preparing-text)] font-semibold",
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
