import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Amount } from "@/components/money/amount";
import type { AssetListing, AvailabilityStatus } from "@/lib/api/endpoints/assets";
import { ASSET_TYPE_LABEL, PLATFORM_LABEL } from "@/lib/config/labels";
import { formatNumber } from "@/lib/money";

export const AVAILABILITY_TONE: Record<AvailabilityStatus, "positive" | "warning" | "muted"> = {
  AVAILABLE: "positive",
  BUSY: "warning",
  UNAVAILABLE: "muted",
};

export const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  AVAILABLE: "Available",
  BUSY: "Busy",
  UNAVAILABLE: "Unavailable",
};

/** One listing, linked to its detail page. Used by brands and by the owner. */
export function AssetCard({ asset, href }: { asset: AssetListing; href: string }) {
  const status = asset.availability?.status ?? "UNAVAILABLE";
  return (
    <Link
      href={href}
      className="group focus-visible:ring-gold/50 rounded-xl focus-visible:ring-2 focus-visible:outline-none"
    >
      <Card className="group-hover:border-bone/15 h-full transition-colors">
        <CardBody className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="muted">{PLATFORM_LABEL[asset.platform] ?? asset.platform}</Badge>
            <Badge tone="muted">{ASSET_TYPE_LABEL[asset.assetType] ?? asset.assetType}</Badge>
            <Badge tone={AVAILABILITY_TONE[status]}>{AVAILABILITY_LABEL[status]}</Badge>
            {asset.verificationStatus === "VERIFIED" ? <Badge tone="positive">Verified</Badge> : null}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-bone line-clamp-2 text-sm font-medium">{asset.title}</h3>
            <p className="text-muted mt-1.5 line-clamp-2 text-xs leading-relaxed">{asset.description}</p>
          </div>
          <div className="border-line-2 flex items-end justify-between border-t pt-3">
            {asset.price !== undefined ? (
              <div>
                <p className="text-muted text-[10px] tracking-[0.14em] uppercase">From</p>
                <Amount minor={asset.price} currency={asset.currency ?? "USD"} className="mt-1 block text-[13px]" />
              </div>
            ) : (
              <p className="text-muted text-[11px]">Price agreed per campaign</p>
            )}
            {asset.estimatedReach ? (
              <p className="tnum text-muted text-[11px]">{formatNumber(asset.estimatedReach)} reach</p>
            ) : null}
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
