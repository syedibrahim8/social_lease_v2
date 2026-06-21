"use client";

import { useState } from "react";
import { Check, Clock, MapPin, Users } from "lucide-react";
import { ApplyDialog } from "@/components/negotiations/apply-dialog";
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
import { formatMoney, formatRelative, initials } from "@/lib/format";
import type { Campaign } from "@/lib/api/mock/marketplace";

export function CampaignDetailSheet({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [applyOpen, setApplyOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        {campaign ? (
          <>
            <SheetHeader>
              <div className="flex items-center gap-2.5">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs">
                    {initials(campaign.brandName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{campaign.brandName}</p>
                  <p className="text-muted-foreground text-xs">
                    Posted {formatRelative(campaign.postedAt)}
                  </p>
                </div>
              </div>
              <SheetTitle className="mt-2 text-xl">{campaign.title}</SheetTitle>
              <SheetDescription className="sr-only">
                Campaign details for {campaign.title}
              </SheetDescription>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="secondary">{campaign.platform}</Badge>
                <Badge variant="outline">{campaign.assetType}</Badge>
              </div>
            </SheetHeader>

            <div className="space-y-6 px-4">
              <div className="bg-muted/50 rounded-xl p-4">
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Budget
                </p>
                <p className="tabular mt-1 text-2xl font-semibold">
                  {formatMoney(campaign.budgetMin)} – {formatMoney(campaign.budgetMax)}
                </p>
                <div className="text-muted-foreground mt-3 flex flex-wrap gap-4 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Users className="size-3.5" /> {campaign.applicants} applicants
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="size-3.5" /> {campaign.durationDays}-day delivery
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" /> {campaign.location}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold">About this campaign</h4>
                <p className="text-muted-foreground mt-2 text-sm">
                  {campaign.description}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="text-sm font-semibold">Requirements</h4>
                <ul className="mt-3 space-y-2.5">
                  {campaign.requirements.map((r) => (
                    <li key={r} className="flex items-start gap-2.5 text-sm">
                      <Check className="text-brand-text mt-0.5 size-4 shrink-0" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <SheetFooter>
              <Button
                variant="brand"
                size="lg"
                className="w-full"
                onClick={() => setApplyOpen(true)}
              >
                Apply to campaign
              </Button>
            </SheetFooter>

            <ApplyDialog
              campaignTitle={campaign.title}
              open={applyOpen}
              onOpenChange={setApplyOpen}
            />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
