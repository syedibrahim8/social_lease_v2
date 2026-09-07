"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { getUnreadCount } from "@/lib/api/endpoints/notifications";
import { qk } from "@/lib/query";
import { cn } from "@/lib/utils";

/**
 * Unread count, kept current by the live stream rather than by polling — the
 * stream invalidates this key on every event, so the badge moves the moment
 * the server sends something.
 *
 * A failed count renders as no badge rather than as an error. Nobody should be
 * shown a broken bell because a secondary request failed.
 */
export function NotificationBell() {
  const { data } = useQuery({
    queryKey: qk.unreadCount(),
    queryFn: getUnreadCount,
    staleTime: 60_000,
  });

  const count = data?.count ?? 0;
  const label =
    count > 0 ? `Notifications, ${count} unread` : "Notifications";

  return (
    <Link
      href="/notifications"
      aria-label={label}
      className={cn(
        "text-muted hover:text-bone hover:bg-bone/5 relative grid size-9 place-items-center rounded-lg",
        "transition-colors duration-[var(--duration-fast)]",
      )}
    >
      <Bell className="size-4" aria-hidden="true" />
      {count > 0 ? (
        <span
          aria-hidden="true"
          className={cn(
            "bg-gold text-[9px] font-bold text-[#15100A]",
            "absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full px-1 py-0.5",
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </Link>
  );
}
