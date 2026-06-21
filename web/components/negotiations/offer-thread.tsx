import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { StatusBadge } from "@/components/data/status-badge";
import { formatMoney, formatRelative, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Offer } from "@/lib/api/mock/negotiations";
import type { Role } from "@/lib/api/types";

interface OfferThreadProps {
  offers: Offer[];
  role: Role;
  brandName: string;
  creatorName: string;
  currency: string;
}

/** Chat-style timeline of offers. The viewer's own offers align right. */
export function OfferThread({
  offers,
  role,
  brandName,
  creatorName,
  currency,
}: OfferThreadProps) {
  return (
    <div className="space-y-4">
      {offers.map((offer) => {
        const mine = offer.sender === role;
        const name = offer.sender === "BRAND" ? brandName : creatorName;
        return (
          <div
            key={offer.id}
            className={cn("flex gap-3", mine && "flex-row-reverse")}
          >
            <Avatar className="mt-1 size-8 shrink-0">
              <AvatarFallback className="text-[10px]">
                {initials(name)}
              </AvatarFallback>
            </Avatar>
            <div
              className={cn(
                "max-w-[80%] rounded-xl border p-4",
                mine ? "border-brand/30 bg-brand-muted/40" : "border-border bg-card",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium">{name}</span>
                <StatusBadge domain="offer" status={offer.status} />
              </div>
              <p className="tabular mt-1.5 text-xl font-semibold">
                {formatMoney(offer.amount, currency)}
              </p>
              {offer.message ? (
                <p className="text-muted-foreground mt-1 text-sm">{offer.message}</p>
              ) : null}
              <p className="text-muted-foreground mt-2 text-xs">
                {formatRelative(offer.at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
