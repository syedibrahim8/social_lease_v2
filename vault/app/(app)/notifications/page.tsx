"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Bell, BellOff, CheckCheck, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { EmptyState } from "@/components/feedback/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import {
  deleteNotification,
  getNotifications,
  markAllRead,
  markRead,
} from "@/lib/api/endpoints/notifications";
import { invalidateFor, qk } from "@/lib/query";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/api/types";
import { toast } from "sonner";

/** Backend types, in words. Anything unmapped falls back to the raw value. */
const TYPE_LABEL: Record<string, string> = {
  CAMPAIGN_CREATED: "New campaign",
  APPLICATION_RECEIVED: "Application",
  OFFER_RECEIVED: "Offer",
  OFFER_ACCEPTED: "Offer accepted",
  PAYMENT_RECEIVED: "Payment",
  SUBMISSION_APPROVED: "Delivery approved",
  VERIFICATION_APPROVED: "Verification",
  ANNOUNCEMENT: "Announcement",
};

const MONEY_TYPES = new Set(["PAYMENT_RECEIVED", "SUBMISSION_APPROVED"]);

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "read", label: "Read" },
] as const;

function ListSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Card key={i}>
          <CardBody className="space-y-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-4 w-2/3" />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function NotificationsBody() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const filter = params.get("filter") ?? "all";
  const readParam =
    filter === "unread" ? { read: false } : filter === "read" ? { read: true } : {};

  const query = useQuery({
    queryKey: qk.notifications({ filter }),
    queryFn: () => getNotifications({ limit: 50, ...readParam }),
  });

  const refresh = () => invalidateFor(queryClient, "notification");

  const readOne = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: refresh,
    onError: (e: unknown) =>
      toast.error(e instanceof ApiError ? e.message : "Could not mark that read."),
  });

  const readAll = useMutation({
    mutationFn: markAllRead,
    onSuccess: () => {
      refresh();
      toast.success("All caught up.");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof ApiError ? e.message : "Could not mark everything read."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: refresh,
    onError: (e: unknown) =>
      toast.error(e instanceof ApiError ? e.message : "Could not delete that."),
  });

  const setFilter = (key: string) => {
    const next = new URLSearchParams(params.toString());
    if (key === "all") next.delete("filter");
    else next.set("filter", key);
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const unreadShown = (query.data?.items ?? []).some((n) => !n.read);

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full border px-3 text-[11px] transition-colors",
                  active
                    ? "border-gold/40 bg-gold/12 text-gold-lo"
                    : "border-line-2 text-muted hover:border-bone/20 hover:text-bone",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {unreadShown ? (
          <Button
            variant="quiet"
            size="sm"
            className="ml-auto h-9"
            loading={readAll.isPending}
            onClick={() => readAll.mutate()}
          >
            <CheckCheck />
            Mark all read
          </Button>
        ) : null}
      </div>

      <QueryBoundary query={query} skeleton={<ListSkeleton />}>
        {(page) =>
          page.items.length === 0 ? (
            <EmptyState
              icon={filter === "unread" ? BellOff : Bell}
              title={filter === "unread" ? "Nothing unread" : "No notifications yet"}
              description={
                filter === "unread"
                  ? "You are caught up. New activity appears here the moment it happens, without a refresh."
                  : "Offers, funding, deliveries and payouts all land here as they happen."
              }
            />
          ) : (
            <ul className="space-y-2.5">
              {page.items.map((n) => (
                <li key={n.id}>
                  <Row
                    notification={n}
                    onRead={() => readOne.mutate(n.id)}
                    onDelete={() => remove.mutate(n.id)}
                  />
                </li>
              ))}
            </ul>
          )
        }
      </QueryBoundary>
    </>
  );
}

function Row({
  notification: n,
  onRead,
  onDelete,
}: {
  notification: Notification;
  onRead: () => void;
  onDelete: () => void;
}) {
  const label = TYPE_LABEL[n.type] ?? n.type;
  // Notifications often name a contract; link to it when the payload says so.
  const contractId =
    typeof n.data?.contractId === "string" ? (n.data.contractId as string) : null;

  const body = (
    <Card className={cn("transition-colors", !n.read && "border-line")}>
      <CardBody className="flex items-start gap-3">
        {/* Unread marker. Carries meaning, so it is not the decorative dot
            banned elsewhere — and the badge says "New" in words too. */}
        <span
          aria-hidden="true"
          className={cn(
            "mt-1.5 size-1.5 shrink-0 rounded-full",
            n.read ? "bg-transparent" : "bg-gold",
          )}
        />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={MONEY_TYPES.has(n.type) ? "gold" : "muted"}>{label}</Badge>
            {!n.read ? <Badge tone="info">New</Badge> : null}
            <span className="tnum text-faint text-[10px]">
              {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className={cn("text-[13px]", n.read ? "text-bone-2" : "text-bone font-medium")}>
            {n.title}
          </p>
          {n.body ? (
            <p className="text-muted mt-0.5 text-xs leading-relaxed">{n.body}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {!n.read ? (
            <button
              type="button"
              aria-label="Mark as read"
              onClick={(e) => {
                e.preventDefault();
                onRead();
              }}
              className="text-muted hover:text-bone hover:bg-bone/5 grid size-9 place-items-center rounded-lg transition-colors"
            >
              <CheckCheck className="size-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Delete notification"
            onClick={(e) => {
              e.preventDefault();
              onDelete();
            }}
            className="text-muted hover:text-negative hover:bg-negative/10 grid size-9 place-items-center rounded-lg transition-colors"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </CardBody>
    </Card>
  );

  return contractId ? (
    <Link href={`/contracts/${contractId}`} className="block">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function NotificationsPage() {
  return (
    <>
      <PageHeader
        title="Notifications"
        description="Everything that happened, newest first. New activity arrives live, without a refresh."
      />
      {/* useSearchParams needs a Suspense boundary during prerender. */}
      <Suspense fallback={<ListSkeleton />}>
        <NotificationsBody />
      </Suspense>
    </>
  );
}
