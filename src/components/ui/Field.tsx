import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FieldProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string | string[];
  required?: boolean;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, hint, error, required, className, children }: FieldProps) {
  const errors = Array.isArray(error) ? error : error ? [error] : [];
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-coral"> *</span>}
      </label>
      {children}
      {hint && errors.length === 0 && <p className="text-xs text-ink-faint">{hint}</p>}
      {errors.map((message) => (
        <p key={message} className="text-xs font-medium text-danger">
          {message}
        </p>
      ))}
    </div>
  );
}
