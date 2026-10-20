"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { checkFraud, type FraudResult, type RiskLevel } from "@/lib/api/endpoints/ai";

const RISK_TONE: Record<RiskLevel, "positive" | "warning" | "negative"> = {
  LOW: "positive",
  MEDIUM: "warning",
  HIGH: "negative",
};

const SIGNAL_LABEL: Record<FraudResult["signals"][number]["type"], string> = {
  FAKE_FOLLOWERS: "Possible bought followers",
  SUSPICIOUS_ENGAGEMENT: "Unusual engagement",
  UNUSUAL_GROWTH: "Unusual growth",
};

const num = (v: string) => Number(v.replace(/,/g, ""));

/**
 * A risk check on an audience's numbers before money is committed. The score
 * is heuristic and says so; each signal is listed with its reason, so the
 * result is a prompt to look closer, not a verdict.
 */
export function FraudCheck({
  defaultFollowers,
  defaultEngagement,
  triggerLabel = "Run a risk check",
}: {
  defaultFollowers?: number | undefined;
  defaultEngagement?: number | undefined;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [followers, setFollowers] = useState(defaultFollowers ? String(defaultFollowers) : "");
  const [engagement, setEngagement] = useState(defaultEngagement ? String(defaultEngagement) : "");
  const [likes, setLikes] = useState("");
  const [comments, setComments] = useState("");

  const check = useMutation({
    mutationFn: () =>
      checkFraud({
        followers: Math.round(num(followers)),
        engagementRate: Number(engagement),
        ...(likes ? { avgLikes: Math.round(num(likes)) } : {}),
        ...(comments ? { avgComments: Math.round(num(comments)) } : {}),
      }),
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not run the check."),
  });

  const valid =
    num(followers) >= 0 &&
    followers !== "" &&
    engagement !== "" &&
    Number(engagement) >= 0 &&
    Number(engagement) <= 100;
  const result = check.data;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <ShieldAlert aria-hidden="true" />
        {triggerLabel}
      </Button>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Audience risk check</DialogTitle>
          <DialogDescription>
            Looks for signs of bought followers or inflated engagement in the numbers you enter.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Followers" htmlFor="fc-followers" required>
            <Input id="fc-followers" value={followers} onChange={(e) => setFollowers(e.target.value)} inputMode="numeric" className="tnum" />
          </Field>
          <Field label="Engagement rate (%)" htmlFor="fc-engagement" required>
            <Input id="fc-engagement" value={engagement} onChange={(e) => setEngagement(e.target.value)} inputMode="decimal" className="tnum" />
          </Field>
          <Field label="Average likes" htmlFor="fc-likes">
            <Input id="fc-likes" value={likes} onChange={(e) => setLikes(e.target.value)} inputMode="numeric" className="tnum" />
          </Field>
          <Field label="Average comments" htmlFor="fc-comments">
            <Input id="fc-comments" value={comments} onChange={(e) => setComments(e.target.value)} inputMode="numeric" className="tnum" />
          </Field>
        </div>

        {result ? (
          <div className="border-line-2 space-y-3 rounded-lg border p-3" aria-live="polite">
            <div className="flex items-center justify-between gap-3">
              <p className="font-display text-bone text-2xl">
                {result.riskScore}
                <span className="text-muted ml-1 font-sans text-[11px]">/ 100 risk</span>
              </p>
              <Badge tone={RISK_TONE[result.riskLevel]}>{result.riskLevel.toLowerCase()} risk</Badge>
            </div>
            {result.signals.length === 0 ? (
              <p className="text-muted text-[12px]">No warning signs in these numbers.</p>
            ) : (
              <ul className="space-y-2">
                {result.signals.map((s, i) => (
                  <li key={i} className="text-[12px]">
                    <span className="text-bone-2 font-medium">{SIGNAL_LABEL[s.type]}</span>
                    <span className="text-muted"> · {s.severity.toLowerCase()}</span>
                    <p className="text-muted mt-0.5 leading-relaxed">{s.detail}</p>
                  </li>
                ))}
              </ul>
            )}
            {result.summary ? <p className="text-bone-2 text-[12px] leading-relaxed">{result.summary}</p> : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button type="button" variant="gold" size="sm" disabled={!valid} loading={check.isPending} onClick={() => check.mutate()}>
            {result ? "Check again" : "Check"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
