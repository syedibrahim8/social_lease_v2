"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, UsersRound } from "lucide-react";
import { EmptyState } from "@/components/feedback/empty-state";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { Card, CardBody } from "@/components/ui/card";
import { ChoicePills } from "@/components/ui/choice-pills";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { getRecommendations, type RankedCreator } from "@/lib/api/endpoints/ai";
import { PLATFORMS, type AssetType, type Platform } from "@/lib/api/types";
import { PLATFORM_LABEL } from "@/lib/config/labels";
import { formatNumber } from "@/lib/money";

const FACTORS: { key: keyof RankedCreator["breakdown"]; label: string }[] = [
  { key: "nicheMatch", label: "Niche" },
  { key: "reach", label: "Reach" },
  { key: "engagement", label: "Engagement" },
  { key: "previousSuccess", label: "Track record" },
];

function FactorBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted w-20 shrink-0 text-[11px]">{label}</span>
      <span className="bg-bone/8 h-1.5 flex-1 overflow-hidden rounded-full" aria-hidden="true">
        <span className="bg-gold block h-full rounded-full" style={{ width: `${pct}%` }} />
      </span>
      <span className="tnum text-bone-2 w-8 text-right text-[11px]">{pct}</span>
    </div>
  );
}

/**
 * Creators ranked for a brief. The ranking is a weighted formula on real
 * profile data, and every factor is shown, so a brand can see WHY someone is
 * near the top rather than taking a score on trust.
 */
export function RecommendedCreators({
  initialPlatform,
  assetType,
  initialNiche = "",
  compact = false,
}: {
  initialPlatform?: Platform | undefined;
  assetType?: AssetType | undefined;
  initialNiche?: string;
  compact?: boolean;
}) {
  const [niche, setNiche] = useState(initialNiche);
  const [platform, setPlatform] = useState<Platform | undefined>(initialPlatform);
  const [submittedNiche, setSubmittedNiche] = useState(initialNiche);

  const input = {
    ...(submittedNiche.trim() ? { niche: submittedNiche.trim() } : {}),
    ...(platform ? { platform } : {}),
    ...(assetType ? { assetType } : {}),
    limit: compact ? 5 : 20,
  };
  const query = useQuery({
    queryKey: ["ai", "recommendations", input],
    queryFn: () => getRecommendations(input),
  });

  return (
    <div className="space-y-4">
      {compact ? null : (
        <Card>
          <CardBody className="space-y-4">
            <form
              className="flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                setSubmittedNiche(niche);
              }}
            >
              <Field label="Niche" htmlFor="rec-niche" className="min-w-48 flex-1">
                <Input
                  id="rec-niche"
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  placeholder="Fitness, beauty, fintech…"
                  maxLength={80}
                />
              </Field>
              <button
                type="submit"
                className="text-gold-lo inline-flex min-h-10 items-center text-[13px] font-medium hover:underline"
              >
                Rank creators
              </button>
            </form>
            <ChoicePills
              label="Platform"
              options={[
                { value: "ANY" as const, label: "Any platform" },
                ...PLATFORMS.filter((p) => p !== "OTHER").map((p) => ({ value: p, label: PLATFORM_LABEL[p] })),
              ]}
              value={platform ?? "ANY"}
              onChange={(v) => setPlatform(v === "ANY" ? undefined : v)}
            />
          </CardBody>
        </Card>
      )}

      <QueryBoundary
        query={query}
        skeleton={
          <div className="space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        }
      >
        {(result) =>
          result.creators.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="No creators to rank yet"
              description="Rankings use creator profiles. As creators join, they'll appear here."
            />
          ) : (
            <div className="space-y-3">
              {result.insight ? (
                <p className="text-bone-2 flex gap-2 text-[13px] leading-relaxed">
                  <Sparkles className="text-gold-lo mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                  {result.insight}
                </p>
              ) : null}
              <ol className="space-y-2">
                {result.creators.map((c, i) => (
                  <li key={c.creatorId}>
                    <Card>
                      <CardBody className="grid gap-3 sm:grid-cols-[1fr_260px] sm:items-center">
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="tnum text-muted w-5 shrink-0 pt-0.5 text-[12px]">{i + 1}</span>
                          <div className="min-w-0">
                            <Link
                              href={`/assets?creatorId=${c.userId}`}
                              className="text-bone hover:text-gold-lo text-[14px] font-medium"
                            >
                              {c.displayName}
                            </Link>
                            <p className="tnum text-muted mt-0.5 text-[12px]">
                              {c.niche ? `${c.niche} · ` : ""}
                              {formatNumber(c.followers)} followers · {c.engagementRate}% engagement
                              {c.completedCampaigns > 0 ? ` · ${c.completedCampaigns} completed` : ""}
                            </p>
                            <p className="font-display text-gold-lo mt-1 text-xl">
                              {Math.round(c.score)}
                              <span className="text-muted ml-1 font-sans text-[11px]">/ 100 match</span>
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          {FACTORS.map((f) => (
                            <FactorBar key={f.key} label={f.label} value={c.breakdown[f.key]} />
                          ))}
                        </div>
                      </CardBody>
                    </Card>
                  </li>
                ))}
              </ol>
              <p className="text-muted text-[11px]">
                Weighted: niche {Math.round(result.weights.niche * 100)}%, reach{" "}
                {Math.round(result.weights.reach * 100)}%, engagement{" "}
                {Math.round(result.weights.engagement * 100)}%, track record{" "}
                {Math.round(result.weights.previousSuccess * 100)}%.
              </p>
            </div>
          )
        }
      </QueryBoundary>
    </div>
  );
}
