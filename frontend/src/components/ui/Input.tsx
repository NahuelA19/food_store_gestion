/**
 * Input — Form input with label, error state, and ARIA support
 */

import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, helperText, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-text-primary"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            "flex h-11 w-full rounded-lg border-2 bg-surface-card px-3.5 py-2.5 text-sm text-text-primary transition-all duration-200",
            "placeholder:text-text-muted/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20",
            "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-surface-alt",
            error
              ? "border-danger focus-visible:border-danger focus-visible:ring-danger/20"
              : "border-border hover:border-brand-300 focus-visible:border-brand-500",
            className
          )}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={
            error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
          }
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs font-medium text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="text-xs text-text-muted"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
