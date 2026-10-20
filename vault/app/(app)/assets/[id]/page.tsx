"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { AvailabilityCalendar } from "@/components/assets/availability-calendar";
import { AVAILABILITY_LABEL, AVAILABILITY_TONE } from "@/components/assets/asset-card";
import { FraudCheck } from "@/components/ai/fraud-check";
import { Amount } from "@/components/money/amount";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getAsset } from "@/lib/api/endpoints/assets";
import { refOrNull } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-provider";
import { ASSET_CATEGORY_LABEL, ASSET_TYPE_LABEL, PLATFORM_LABEL } from "@/lib/config/labels";
import { formatNumber } from "@/lib/money";
import { qk } from "@/lib/query";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted text-[10px] font-semibold tracking-[0.14em] uppercase">{label}</p>
      <p className="tnum text-bone mt-1 text-[15px]">{value}</p>
    </div>
  );
}

/** A creator's listing, as a brand sees it. */
export default function AssetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { role } = useAuth();
  const query = useQuery({ queryKey: qk.asset(id), queryFn: () => getAsset(id) });

  return (
    <>
      <BackLink href="/assets">Find creators</BackLink>
      <QueryBoundary query={query} skeleton={<Skeleton className="h-96 w-full" />}>
        {(asset) => {
          const creator = refOrNull(asset.creatorId);
          const status = asset.availability.status;
          const d = asset.audienceDemographics;
          return (
            <>
              <PageHeader
                title={asset.title}
                description={creator ? `Listed by ${creator.name}` : undefined}
                action={
                  role === "BRAND" || role === "ADMIN" ? (
                    <FraudCheck defaultFollowers={asset.estimatedReach} />
                  ) : undefined
                }
              />
              <div className="mb-6 flex flex-wrap gap-1.5">
                <Badge tone="muted">{PLATFORM_LABEL[asset.platform]}</Badge>
                <Badge tone="muted">{ASSET_TYPE_LABEL[asset.assetType]}</Badge>
                <Badge tone="muted">{ASSET_CATEGORY_LABEL[asset.category]}</Badge>
                <Badge tone={AVAILABILITY_TONE[status]}>{AVAILABILITY_LABEL[status]}</Badge>
                {asset.verificationStatus === "VERIFIED" ? <Badge tone="positive">Verified</Badge> : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
                <div className="space-y-4">
                  <Card>
                    <CardBody>
                      <p className="text-bone-2 text-[13px] leading-relaxed whitespace-pre-wrap">{asset.description}</p>
                    </CardBody>
                  </Card>
                  {d && (d.genderSplit || d.topCountries?.length || d.topCities?.length) ? (
                    <Card>
                      <CardBody className="space-y-3">
                        <p className="text-bone text-[13px] font-medium">Audience</p>
                        {d.genderSplit ? (
                          <p className="tnum text-bone-2 text-[13px]">
                            {[
                              d.genderSplit.female !== undefined ? `${d.genderSplit.female}% women` : null,
                              d.genderSplit.male !== undefined ? `${d.genderSplit.male}% men` : null,
                              d.genderSplit.other !== undefined ? `${d.genderSplit.other}% other` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        ) : null}
                        {d.topCountries?.length ? (
                          <p className="tnum text-bone-2 text-[13px]">
                            {d.topCountries.map((c) => `${c.country} ${c.percentage}%`).join(" · ")}
                          </p>
                        ) : null}
                        {d.topCities?.length ? (
                          <p className="text-muted text-[12px]">Top cities: {d.topCities.join(", ")}</p>
                        ) : null}
                      </CardBody>
                    </Card>
                  ) : null}
                  <AvailabilityCalendar assetId={asset.id} blocks={asset.availability.blocks ?? []} editable={false} />
                </div>

                <Card tone="money" className="h-fit">
                  <CardBody className="space-y-4">
                    <div>
                      <p className="text-muted text-[10px] font-semibold tracking-[0.14em] uppercase">Asking price</p>
                      {asset.price !== undefined ? (
                        <Amount minor={asset.price} currency={asset.currency ?? "USD"} className="mt-1 block text-2xl" />
                      ) : (
                        <p className="text-bone-2 mt-1 text-[13px]">Agreed per campaign</p>
                      )}
                    </div>
                    <div className="border-line grid grid-cols-2 gap-4 border-t pt-4">
                      <Metric label="Est. reach" value={asset.estimatedReach ? formatNumber(asset.estimatedReach) : "—"} />
                      <Metric label="Avg. views" value={asset.averageViews ? formatNumber(asset.averageViews) : "—"} />
                    </div>
                    {asset.availability.leadTimeDays !== undefined ? (
                      <p className="text-muted text-[11px]">
                        Needs {asset.availability.leadTimeDays} days&apos; notice.
                      </p>
                    ) : null}
                  </CardBody>
                </Card>
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </>
  );
}
