"use client";

import { BadgeCheck, Star } from "lucide-react";
import { toast } from "sonner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AvailabilityPill } from "./availability-pill";
import { AvailabilityCalendar } from "./availability-calendar";
import { formatCompact, formatMoney, initials } from "@/lib/format";
import type { AssetListing } from "@/lib/api/mock/marketplace";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-border rounded-lg border p-3">
      <p className="tabular text-base font-semibold">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}

export function AssetDetailSheet({
  asset,
  open,
  onOpenChange,
}: {
  asset: AssetListing | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {asset ? (
          <>
            <SheetHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Avatar className="size-8">
                    <AvatarFallback className="text-xs">
                      {initials(asset.creatorName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium">{asset.creatorName}</span>
                    {asset.verificationStatus === "VERIFIED" ? (
                      <BadgeCheck className="text-brand-text size-4" />
                    ) : null}
                  </div>
                </div>
                <AvailabilityPill status={asset.availabilityStatus} />
              </div>
              <SheetTitle className="mt-2 text-xl">{asset.title}</SheetTitle>
              <SheetDescription className="sr-only">
                Asset details for {asset.title}
              </SheetDescription>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{asset.category}</Badge>
                <Badge variant="outline">{asset.assetType}</Badge>
                <Badge variant="outline">{asset.platform}</Badge>
              </div>
            </SheetHeader>

            <div className="space-y-6 px-4">
              <div className="grid grid-cols-2 gap-3">
                <Metric label="Estimated reach" value={formatCompact(asset.estimatedReach)} />
                <Metric label="Avg views" value={formatCompact(asset.avgViews)} />
                <Metric label="Engagement" value={`${(asset.engagementRate * 100).toFixed(1)}%`} />
                <Metric label="Lead time" value={`${asset.leadTimeDays} days`} />
              </div>

              <div>
                <h4 className="text-sm font-semibold">About this asset</h4>
                <p className="text-muted-foreground mt-2 text-sm">
                  {asset.description}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="mb-3 text-sm font-semibold">Availability</h4>
                <AvailabilityCalendar busyDays={asset.busyDays} />
              </div>
            </div>

            <SheetFooter>
              <div className="flex w-full items-center justify-between">
                <div>
                  <p className="tabular text-lg font-semibold">
                    {formatMoney(asset.price)}
                  </p>
                  <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
                    <Star className="fill-warning text-warning size-3.5" />
                    {asset.rating.toFixed(1)} ({asset.reviews} reviews)
                  </span>
                </div>
                <Button
                  variant="brand"
                  size="lg"
                  onClick={() =>
                    toast.success("Invite sent", {
                      description: `${asset.creatorName} will be notified of your campaign.`,
                    })
                  }
                >
                  Invite to campaign
                </Button>
              </div>
            </SheetFooter>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
