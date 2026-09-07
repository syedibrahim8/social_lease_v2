"use client";

import type { UseQueryResult } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ErrorState } from "@/components/feedback/error-state";

/**
 * The single place pending and error are handled, so no screen invents its own
 * spinner or swallows a failure.
 *
 * Empty is deliberately NOT handled here. An empty wallet and an empty contract
 * list need different words and different next steps, so the caller owns that
 * decision — see EmptyState. Folding it in here would produce one generic
 * "No data" for the whole app, which is exactly the shrug this app exists to
 * avoid. Do not "simplify" it.
 */
export function QueryBoundary<T>({
  query,
  skeleton,
  children,
}: {
  query: UseQueryResult<T>;
  skeleton: ReactNode;
  children: (data: T) => ReactNode;
}) {
  if (query.isPending) return <>{skeleton}</>;
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  return <>{children(query.data)}</>;
}
