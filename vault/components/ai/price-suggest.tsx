"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Amount } from "@/components/money/amount";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { suggestPrice, type PriceSuggestion } from "@/lib/api/endpoints/ai";
import type { AssetType, Platform } from "@/lib/api/types";
import { useMyProfile } from "@/lib/auth/use-profile";

/**
 * A price suggestion from audience size and engagement.
 *
 * Uses the numbers on the creator's profile when they're there and asks for
 * them when they aren't. The breakdown is shown so the number is explainable,
 * not a black box, and nothing is applied until the creator picks a figure.
 */
export function PriceSuggest({
  platform,
  assetType,
  onApply,
}: {
  platform: Platform | undefined;
  assetType: AssetType | undefined;
  onApply: (minor: number) => void;
}) {
  const { creatorProfile } = useMyProfile();
  const known = creatorProfile?.metrics;
  const [followers, setFollowers] = useState("");
  const [engagement, setEngagement] = useState("");

  const followerCount = known?.followers || Number(followers.replace(/,/g, ""));
  const engagementRate = known?.engagementRate || Number(engagement);
  const ready =
    platform !== undefined &&
    assetType !== undefined &&
    Number.isFinite(followerCount) &&
    followerCount > 0 &&
    Number.isFinite(engagementRate) &&
    engagementRate > 0 &&
    engagementRate <= 100;

  const suggest = useMutation<PriceSuggestion>({
    mutationFn: () =>
      suggestPrice({
        platform: platform as Platform,
        assetType: assetType as AssetType,
        followers: Math.round(followerCount),
        engagementRate,
      }),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not suggest a price."),
  });
  const result = suggest.data;

  return (
    <Card className="bg-surface-2/40">
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-bone flex items-center gap-1.5 text-[13px] font-medium">
            <Sparkles className="text-gold-lo size-3.5" aria-hidden="true" />
            Price suggestion
          </p>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={!ready}
            loading={suggest.isPending}
            onClick={() => suggest.mutate()}
          >
            {result ? "Recalculate" : "Suggest a price"}
          </Button>
        </div>

        {!known?.followers || !known.engagementRate ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Followers" htmlFor="ps-followers">
              <Input
                id="ps-followers"
                value={followers}
                onChange={(e) => setFollowers(e.target.value)}
                inputMode="numeric"
                className="tnum"
              />
            </Field>
            <Field label="Engagement rate (%)" htmlFor="ps-engagement">
              <Input
                id="ps-engagement"
                value={engagement}
                onChange={(e) => setEngagement(e.target.value)}
                inputMode="decimal"
                className="tnum"
              />
            </Field>
          </div>
        ) : (
          <p className="text-muted text-[12px]">
            Based on your profile: {known.followers.toLocaleString()} followers,{" "}
            {known.engagementRate}% engagement.
          </p>
        )}

        {platform === undefined || assetType === undefined ? (
          <p className="text-muted text-[12px]">Pick the platform and asset first.</p>
        ) : null}

        {result ? (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["Low", result.min],
                  ["Suggested", result.suggested],
                  ["High", result.max],
                ] as const
              ).map(([label, minor]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => onApply(minor)}
                  className="border-line-2 hover:border-gold/40 rounded-lg border px-3 py-2 text-left transition-colors"
                >
                  <span className="text-muted block text-[11px]">{label}</span>
                  <Amount minor={minor} currency={result.currency} className="text-[14px]" />
                </button>
              ))}
            </div>
            <p className="text-muted text-[11px] leading-relaxed">
              Rate per 1,000 followers <Amount minor={result.breakdown.ratePerThousandFollowers} />,
              asset ×{result.breakdown.assetMultiplier}, engagement ×
              {result.breakdown.engagementMultiplier.toFixed(2)}. Tap a figure to use it.
            </p>
            {result.rationale ? (
              <p className="text-bone-2 text-[12px] leading-relaxed">{result.rationale}</p>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
