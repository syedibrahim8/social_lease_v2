import { Clock, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatMoney, formatRelative, initials } from "@/lib/format";
import type { Campaign } from "@/lib/api/mock/marketplace";

export function CampaignCard({
  campaign,
  onClick,
}: {
  campaign: Campaign;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="hover:border-brand/40 h-full gap-3 p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-7">
            <AvatarFallback className="text-[10px]">
              {initials(campaign.brandName)}
            </AvatarFallback>
          </Avatar>
          <span className="text-muted-foreground truncate text-xs">
            {campaign.brandName} · {formatRelative(campaign.postedAt)}
          </span>
        </div>

        <h3 className="line-clamp-1 text-base font-semibold">{campaign.title}</h3>
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {campaign.description}
        </p>

        <div className="flex flex-wrap gap-1.5">
          <Badge variant="secondary">{campaign.platform}</Badge>
          <Badge variant="outline">{campaign.assetType}</Badge>
        </div>

        <div className="border-border mt-1 flex items-center justify-between border-t pt-3">
          <span className="tabular text-sm font-semibold">
            {formatMoney(campaign.budgetMin)} – {formatMoney(campaign.budgetMax)}
          </span>
          <div className="text-muted-foreground flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {campaign.applicants}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3.5" />
              {campaign.durationDays}d
            </span>
          </div>
        </div>
      </Card>
    </button>
  );
}
