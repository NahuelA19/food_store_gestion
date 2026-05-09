/**
 * Button — Primary UI component with CVA variants
 * Patterns: shadcn/ui compatible, TypeScript strict, React 18
 */

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-text-on-primary shadow-sm hover:bg-primary-hover hover:shadow-md active:scale-[0.98]",
        destructive:
          "bg-danger text-white shadow-sm hover:bg-danger/90 hover:shadow-md active:scale-[0.98]",
        outline:
          "border-2 border-border bg-surface-card text-text-primary hover:bg-surface-alt hover:border-brand-400 active:scale-[0.98]",
        secondary:
          "bg-surface-alt text-text-primary border border-border hover:bg-border/50 active:scale-[0.98]",
        ghost:
          "text-text-secondary hover:bg-surface-alt hover:text-text-primary active:scale-[0.98]",
        link:
          "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10 p-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
