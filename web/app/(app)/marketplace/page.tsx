"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { getCampaigns } from "@/lib/api/endpoints/marketplace";
import { PageHeader } from "@/components/layout/page-header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterGroup, FilterRail } from "@/components/marketplace/filter-rail";
import { CampaignCard } from "@/components/marketplace/campaign-card";
import { CampaignDetailSheet } from "@/components/marketplace/campaign-detail";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import {
  BUDGET_BUCKETS,
  CAMPAIGN_ASSET_TYPES,
  CAMPAIGN_PLATFORMS,
  CAMPAIGN_SORTS,
} from "@/lib/config/marketplace";
import type { Campaign } from "@/lib/api/mock/marketplace";

const ALL = "all";

export default function MarketplacePage() {
  const query = useQuery({ queryKey: ["campaigns"], queryFn: getCampaigns });

  const [search, setSearch] = useState("");
  const [platform, setPlatform] = useState(ALL);
  const [assetType, setAssetType] = useState(ALL);
  const [budget, setBudget] = useState(ALL);
  const [sort, setSort] = useState("recent");
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [open, setOpen] = useState(false);

  const activeCount = [platform, assetType, budget].filter((v) => v !== ALL).length;

  const filtered = useMemo(() => {
    const list = (query.data ?? []).filter((c) => {
      if (
        search &&
        !`${c.title} ${c.brandName} ${c.description}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      if (platform !== ALL && c.platform !== platform) return false;
      if (assetType !== ALL && c.assetType !== assetType) return false;
      if (budget !== ALL) {
        const [lo, hi] = budget.split("-");
        const min = Number(lo);
        const max = hi ? Number(hi) : Infinity;
        if (c.budgetMax < min || c.budgetMin > max) return false;
      }
      return true;
    });
    const sorted = [...list];
    if (sort === "budget-desc") sorted.sort((a, b) => b.budgetMax - a.budgetMax);
    else if (sort === "budget-asc") sorted.sort((a, b) => a.budgetMin - b.budgetMin);
    else sorted.sort((a, b) => +new Date(b.postedAt) - +new Date(a.postedAt));
    return sorted;
  }, [query.data, search, platform, assetType, budget, sort]);

  const clearFilters = () => {
    setSearch("");
    setPlatform(ALL);
    setAssetType(ALL);
    setBudget(ALL);
  };

  const openDetail = (c: Campaign) => {
    setSelected(c);
    setOpen(true);
  };

  const filters = (
    <>
      <FilterGroup label="Platform">
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All platforms</SelectItem>
            {CAMPAIGN_PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup label="Asset type">
        <Select value={assetType} onValueChange={setAssetType}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All types</SelectItem>
            {CAMPAIGN_ASSET_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup label="Budget">
        <Select value={budget} onValueChange={setBudget}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any budget</SelectItem>
            {BUDGET_BUCKETS.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>
      {activeCount > 0 ? (
        <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
          Clear filters
        </Button>
      ) : null}
    </>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign Marketplace"
        description="Browse open campaigns and apply to the ones that fit."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns, brands…"
            className="pl-8"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CAMPAIGN_SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <FilterRail activeCount={activeCount}>{filters}</FilterRail>

        <div>
          {query.isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="gap-3 p-5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-4 w-24" />
                </Card>
              ))}
            </div>
          ) : query.isError ? (
            <ErrorState onRetry={query.refetch} />
          ) : filtered.length === 0 ? (
            <Card className="p-0">
              <EmptyState
                icon={<Search />}
                title="No campaigns match your filters"
                description="Try widening your search or clearing some filters."
                action={
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              <p className="text-muted-foreground mb-4 text-sm">
                {filtered.length} campaign{filtered.length === 1 ? "" : "s"}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((c) => (
                  <CampaignCard
                    key={c.id}
                    campaign={c}
                    onClick={() => openDetail(c)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <CampaignDetailSheet
        campaign={selected}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
