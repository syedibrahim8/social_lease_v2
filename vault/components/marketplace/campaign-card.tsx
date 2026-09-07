import Link from "next/link";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Amount } from "@/components/money/amount";
import { ASSET_TYPE_LABEL, CAMPAIGN_STATUS, PLATFORM_LABEL } from "@/lib/config/labels";
import type { Campaign } from "@/lib/api/types";

export function CampaignCard({
  campaign,
  href,
  showStatus = false,
}: {
  campaign: Campaign;
  href: string;
  /** Own-campaign views need the status; public browse is all PUBLISHED. */
  showStatus?: boolean;
}) {
  const status = CAMPAIGN_STATUS[campaign.status];

  return (
    <Link href={href} className="group block">
      <Card className="hover:border-line h-full transition-colors">
        <CardBody className="flex h-full flex-col gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge tone="muted">{ASSET_TYPE_LABEL[campaign.assetType]}</Badge>
            <Badge tone="muted">{PLATFORM_LABEL[campaign.platform]}</Badge>
            {showStatus ? <Badge tone={status.tone}>{status.label}</Badge> : null}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-bone group-hover:text-gold-lo line-clamp-2 text-sm font-medium transition-colors">
              {campaign.title}
            </h3>
            <p className="text-muted mt-1.5 line-clamp-2 text-xs leading-relaxed">
              {campaign.description}
            </p>
          </div>

          <div className="border-line-2 flex items-end justify-between border-t pt-3">
            <div>
              <p className="text-faint text-[10px] tracking-[0.14em] uppercase">Budget</p>
              <p className="mt-1 text-[13px]">
                <Amount minor={campaign.budgetMin} currency={campaign.currency} />
                <span className="text-faint mx-1">to</span>
                <Amount minor={campaign.budgetMax} currency={campaign.currency} />
              </p>
            </div>
            <p className="tnum text-muted flex items-center gap-1.5 text-[11px]">
              <Clock className="size-3" aria-hidden="true" />
              {campaign.duration}d
            </p>
          </div>
        </CardBody>
      </Card>
    </Link>
  );
}
