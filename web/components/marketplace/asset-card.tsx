import { BadgeCheck, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { AvailabilityPill } from "./availability-pill";
import { formatCompact, formatMoney, initials } from "@/lib/format";
import type { AssetListing } from "@/lib/api/mock/marketplace";

export function AssetCard({
  asset,
  onClick,
}: {
  asset: AssetListing;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="hover:border-brand/40 h-full gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="size-7">
              <AvatarFallback className="text-[10px]">
                {initials(asset.creatorName)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs font-medium">
              {asset.creatorName}
            </span>
            {asset.verificationStatus === "VERIFIED" ? (
              <BadgeCheck className="text-brand-text size-3.5 shrink-0" />
            ) : null}
          </div>
          <AvailabilityPill status={asset.availabilityStatus} />
        </div>

        <h3 className="line-clamp-1 text-base font-semibold">{asset.title}</h3>
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {asset.description}
        </p>

        <div className="text-muted-foreground grid grid-cols-3 gap-2 text-xs">
          <div>
            <p className="tabular text-foreground text-sm font-medium">
              {formatCompact(asset.estimatedReach)}
            </p>
            <p>Reach</p>
          </div>
          <div>
            <p className="tabular text-foreground text-sm font-medium">
              {formatCompact(asset.avgViews)}
            </p>
            <p>Avg views</p>
          </div>
          <div>
            <p className="tabular text-foreground text-sm font-medium">
              {(asset.engagementRate * 100).toFixed(1)}%
            </p>
            <p>Engagement</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{asset.category}</Badge>
          <Badge variant="outline">{asset.platform}</Badge>
        </div>

        <div className="border-border mt-1 flex items-center justify-between border-t pt-3">
          <span className="tabular text-sm font-semibold">
            {formatMoney(asset.price)}
          </span>
          <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
            <Star className="size-3.5 fill-warning text-warning" />
            {asset.rating.toFixed(1)} ({asset.reviews})
          </span>
        </div>
      </Card>
    </button>
  );
}
