"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A labelled field with helper text and an error slot.
 *
 * Labels are always visible — placeholder-as-label loses the question the
 * moment someone starts typing, which is worst exactly where it matters most
 * (an amount, an account detail). Errors sit below their own field and are
 * wired with aria-describedby + role="alert" so a screen reader hears them.
 */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string | undefined;
  hint?: string | undefined;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-bone-2 text-xs font-medium">
        {label}
        {required ? (
          <span className="text-gold ml-1" aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {children}

      {hint && !error ? (
        <p id={hintId} className="text-muted text-[11px] leading-relaxed">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="text-negative flex items-start gap-1.5 text-[11px] leading-relaxed"
        >
          <AlertCircle className="mt-px size-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** Props to spread onto the control inside a Field, so a11y wiring is not forgotten. */
export function fieldControlProps(id: string, error?: string, hint?: string) {
  const described = [hint ? `${id}-hint` : null, error ? `${id}-error` : null]
    .filter(Boolean)
    .join(" ");
  return {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": described || undefined,
  } as const;
}
