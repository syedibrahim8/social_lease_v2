"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTokenForStream } from "@/lib/api/client";
import { openEventStream } from "@/lib/api/stream";
import { useAuth } from "@/lib/auth/auth-provider";
import { invalidateFor, qk } from "@/lib/query";
import type { Notification } from "@/lib/api/types";

/** Reconnect backoff: 1s doubling to a 30s ceiling. */
const BASE_DELAY_MS = 1_000;
const MAX_DELAY_MS = 30_000;

/**
 * Subscribes to the live notification stream for the signed-in user.
 *
 * Mounted once, in the app shell. On each event it raises a toast, bumps the
 * unread badge, and invalidates whatever the event implicates — so a payout
 * landing on the server updates the wallet on screen without anyone refreshing.
 *
 * Reconnects with exponential backoff. A dropped stream must not turn into a
 * request loop against a backend that may be down, which is exactly what a
 * naive `catch { reconnect() }` produces.
 */
export function useNotificationStream(): void {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const attemptRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;

    const connect = async (): Promise<void> => {
      if (stopped) return;

      // Read the token at connect time, not at mount: it rotates roughly every
      // 15 minutes and a stale one would 401 the handshake forever.
      const token = await getTokenForStream();
      if (!token || stopped) return scheduleRetry();

      try {
        await openEventStream({
          path: "/notifications/stream",
          token,
          signal: controller.signal,
          onEvent: (event) => {
            attemptRef.current = 0; // A delivered frame proves the link is good.
            handleEvent(event.data);
          },
        });
        // Clean server close — reconnect unless we are tearing down.
        scheduleRetry();
      } catch {
        scheduleRetry();
      }
    };

    const scheduleRetry = (): void => {
      if (stopped) return;
      const delay = Math.min(BASE_DELAY_MS * 2 ** attemptRef.current, MAX_DELAY_MS);
      attemptRef.current += 1;
      timer = setTimeout(() => void connect(), delay);
    };

    const handleEvent = (payload: unknown): void => {
      const notification = payload as Notification | null;
      if (!notification || typeof notification !== "object") return;

      if (notification.title) {
        toast(notification.title, {
          description: notification.body,
        });
      }

      invalidateFor(queryClient, "notification");

      // Notifications are the app's push channel for domain changes, so a
      // payment or delivery event should also refresh the money surfaces
      // rather than waiting for the next poll.
      const type = notification.type ?? "";
      if (/payment|payout|submission|contract/i.test(type)) {
        void queryClient.invalidateQueries({ queryKey: qk.wallet() });
        void queryClient.invalidateQueries({ queryKey: qk.transactions() });
        void queryClient.invalidateQueries({ queryKey: qk.contracts() });
      }
    };

    void connect();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      controller.abort();
    };
  }, [isAuthenticated, queryClient]);
}
