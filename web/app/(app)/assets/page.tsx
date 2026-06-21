"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { getAssets } from "@/lib/api/endpoints/marketplace";
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
import { AssetCard } from "@/components/marketplace/asset-card";
import { AssetDetailSheet } from "@/components/marketplace/asset-detail";
import { EmptyState } from "@/components/feedback/empty-state";
import { ErrorState } from "@/components/feedback/error-state";
import {
  ASSET_CATEGORIES,
  ASSET_PLATFORMS,
  ASSET_SORTS,
  AVAILABILITY_OPTIONS,
} from "@/lib/config/marketplace";
import type { AssetListing } from "@/lib/api/mock/marketplace";

const ALL = "all";

export default function AssetsPage() {
  const query = useQuery({ queryKey: ["assets"], queryFn: getAssets });

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);
  const [platform, setPlatform] = useState(ALL);
  const [availability, setAvailability] = useState(ALL);
  const [verified, setVerified] = useState(ALL);
  const [sort, setSort] = useState("reach-desc");
  const [selected, setSelected] = useState<AssetListing | null>(null);
  const [open, setOpen] = useState(false);

  const activeCount = [category, platform, availability, verified].filter(
    (v) => v !== ALL,
  ).length;

  const filtered = useMemo(() => {
    const list = (query.data ?? []).filter((a) => {
      if (
        search &&
        !`${a.title} ${a.creatorName} ${a.description}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
        return false;
      if (category !== ALL && a.category !== category) return false;
      if (platform !== ALL && a.platform !== platform) return false;
      if (availability !== ALL && a.availabilityStatus !== availability) return false;
      if (verified === "verified" && a.verificationStatus !== "VERIFIED") return false;
      return true;
    });
    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    else sorted.sort((a, b) => b.estimatedReach - a.estimatedReach);
    return sorted;
  }, [query.data, search, category, platform, availability, verified, sort]);

  const clearFilters = () => {
    setSearch("");
    setCategory(ALL);
    setPlatform(ALL);
    setAvailability(ALL);
    setVerified(ALL);
  };

  const openDetail = (a: AssetListing) => {
    setSelected(a);
    setOpen(true);
  };

  const filters = (
    <>
      <FilterGroup label="Category">
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {ASSET_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup label="Platform">
        <Select value={platform} onValueChange={setPlatform}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All platforms</SelectItem>
            {ASSET_PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup label="Availability">
        <Select value={availability} onValueChange={setAvailability}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any availability</SelectItem>
            {AVAILABILITY_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterGroup>
      <FilterGroup label="Verification">
        <Select value={verified} onValueChange={setVerified}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All creators</SelectItem>
            <SelectItem value="verified">Verified only</SelectItem>
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
        title="Creator Asset Marketplace"
        description="Discover creator-owned assets and invite them to your campaigns."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search assets, creators…"
            className="pl-8"
          />
        </div>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ASSET_SORTS.map((s) => (
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
                title="No assets match your filters"
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
                {filtered.length} asset{filtered.length === 1 ? "" : "s"}
              </p>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((a) => (
                  <AssetCard key={a.id} asset={a} onClick={() => openDetail(a)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <AssetDetailSheet asset={selected} open={open} onOpenChange={setOpen} />
    </div>
  );
}
