/**
 * Skeleton — Loading placeholder with shimmer animation
 * Respects prefers-reduced-motion
 */

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circle" | "rect";
}

export function Skeleton({
  className,
  variant = "text",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-gradient-to-r from-[color:var(--color-surface-alt)] via-border/50 to-[color:var(--color-surface-alt)] bg-[length:200%_100%] motion-reduce:animate-none motion-reduce:bg-[color:var(--color-surface-alt)]",
        variant === "text" && "h-4 w-full rounded-md",
        variant === "circle" && "rounded-full",
        variant === "rect" && "rounded-xl",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-xl border border-border p-4 space-y-3">
      <Skeleton variant="rect" className="h-40 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-8 w-full rounded-lg" />
    </div>
  );
}
