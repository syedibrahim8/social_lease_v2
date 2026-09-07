"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Amount } from "@/components/money/amount";
import type { Offer, OfferStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const OFFER_TONE: Record<OfferStatus, "gold" | "positive" | "negative" | "muted"> = {
  PENDING: "gold",
  ACCEPTED: "positive",
  REJECTED: "negative",
  COUNTERED: "muted",
};

const OFFER_LABEL: Record<OfferStatus, string> = {
  PENDING: "On the table",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
  COUNTERED: "Countered",
};

/**
 * The embedded offers[] array as a conversation.
 *
 * Yours sit right, theirs left, which is the one convention everybody already
 * knows from every messaging app. The amount is the message here, so it is the
 * largest thing in each bubble.
 */
export function OfferThread({
  offers,
  currency,
  currentUserId,
}: {
  offers: Offer[];
  currency: string;
  currentUserId: string;
}) {
  if (offers.length === 0) {
    return (
      <p className="text-muted py-8 text-center text-xs">
        No offers yet. The opening offer is made when the creator applies.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {offers.map((offer, i) => {
        const mine = offer.sender === currentUserId;
        return (
          <li
            key={offer._id ?? `${offer.createdAt}-${i}`}
            className={cn("flex", mine ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-xl border px-4 py-3 sm:max-w-[70%]",
                mine ? "border-line bg-emerald-lo" : "border-line-2 bg-surface",
              )}
            >
              <div className="mb-1.5 flex items-center gap-2">
                <span className="text-faint text-[10px] font-semibold tracking-[0.14em] uppercase">
                  {mine ? "You offered" : "They offered"}
                </span>
                <Badge tone={OFFER_TONE[offer.status]}>{OFFER_LABEL[offer.status]}</Badge>
              </div>

              <Amount minor={offer.amount} currency={currency} className="block text-lg" />

              {offer.message ? (
                <p className="text-bone-2 mt-2 text-[13px] leading-relaxed whitespace-pre-wrap">
                  {offer.message}
                </p>
              ) : null}

              <p className="tnum text-faint mt-2 text-[10px]">
                {format(new Date(offer.createdAt), "MMM d, HH:mm")}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
