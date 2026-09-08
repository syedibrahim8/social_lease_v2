"use client";

import { toast } from "sonner";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { ApiError } from "@/lib/api/client";

/**
 * Put the server's answer where the user is looking.
 *
 * The backend returns `errors: [{ field, message }]` on a 422, so a rejected
 * password lands under the password input rather than in a toast the user has
 * to map back to a field themselves. Anything without a field, and anything
 * that is not a 422, becomes a toast — those are about the request, not about
 * one input.
 */
export function applyServerErrors<T extends FieldValues>(
  error: unknown,
  setError: UseFormSetError<T>,
  fallback = "Something went wrong. Please try again.",
): void {
  if (!(error instanceof ApiError)) {
    toast.error(fallback);
    return;
  }

  const fieldErrors = error.errors.filter((e) => e.field);
  if (fieldErrors.length > 0) {
    for (const e of fieldErrors) {
      setError(e.field as Path<T>, { type: "server", message: e.message });
    }
    return;
  }

  toast.error(error.message || fallback);
}
