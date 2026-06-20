"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/feedback/empty-state";
import { mockNotifications } from "@/lib/api/mock";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const [items, setItems] = useState(mockNotifications);
  const unread = items.filter((n) => !n.read).length;

  const markAllRead = () =>
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        >
          <Bell />
          {unread > 0 ? (
            <span className="bg-brand text-brand-foreground tabular absolute -top-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full text-[10px] font-semibold">
              {unread}
            </span>
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-border flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notifications</span>
          {unread > 0 ? (
            <button
              onClick={markAllRead}
              className="text-brand-text text-xs font-medium hover:underline"
            >
              Mark all read
            </button>
          ) : null}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon={<Bell />}
            title="You're all caught up"
            description="New activity will show up here."
          />
        ) : (
          <ScrollArea className="max-h-80">
            <ul className="divide-border divide-y">
              {items.map((n) => (
                <li
                  key={n.id}
                  className={cn(
                    "flex gap-3 px-4 py-3",
                    !n.read && "bg-brand-muted/40",
                  )}
                >
                  <span
                    className={cn(
                      "mt-1.5 size-1.5 shrink-0 rounded-full",
                      n.read ? "bg-transparent" : "bg-brand",
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-muted-foreground text-sm">{n.body}</p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                      {formatRelative(n.createdAt)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}

        <div className="border-border border-t p-2">
          <Button asChild variant="ghost" size="sm" className="w-full">
            <Link href="/notifications">View all notifications</Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
