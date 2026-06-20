import type { ReactNode } from "react";
import { ErrorState } from "@/components/feedback/error-state";

/** Minimal structural shape of a TanStack Query result we depend on. */
interface QueryLike<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  refetch?: () => void;
}

interface QueryBoundaryProps<T> {
  query: QueryLike<T>;
  /** Skeleton matching the real layout (preferred over a spinner). */
  loading: ReactNode;
  /** Predicate that decides whether resolved data should show the empty state. */
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  errorTitle?: string;
  errorDescription?: string;
  children: (data: T) => ReactNode;
}

/**
 * Maps a query's loading / error / empty / success states to the standard
 * surfaces in ONE place, so every data view behaves identically.
 */
export function QueryBoundary<T>({
  query,
  loading,
  isEmpty,
  empty,
  errorTitle,
  errorDescription,
  children,
}: QueryBoundaryProps<T>) {
  if (query.isPending) return <>{loading}</>;

  if (query.isError || query.data === undefined) {
    return (
      <ErrorState
        title={errorTitle}
        description={errorDescription}
        onRetry={query.refetch}
      />
    );
  }

  if (isEmpty?.(query.data) && empty !== undefined) {
    return <>{empty}</>;
  }

  return <>{children(query.data)}</>;
}
