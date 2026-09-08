"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";

export function QueryProvider({ children }: { children: ReactNode }) {
  // Created in state so each browser session gets exactly one client and it
  // survives re-renders without being shared across users on the server.
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            retry: (failureCount, error) => {
              // Never retry what the server has already answered definitively.
              // A 403 on a payout guard or a 404 on someone else's contract is
              // the correct answer, and hammering it just delays showing it.
              if (error instanceof ApiError) {
                if (error.status >= 400 && error.status < 500) return false;
              }
              return failureCount < 2;
            },
          },
          mutations: {
            // Money mutations are never retried automatically. A retried
            // release could, in the wrong circumstances, transfer twice.
            retry: false,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
