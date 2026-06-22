"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

const TYPES = [
  { key: "campaign.created", label: "New campaigns", desc: "When a brand posts a campaign" },
  { key: "application.received", label: "Applications", desc: "When a creator applies to your campaign" },
  { key: "offer.received", label: "Offers & counters", desc: "New offers in a negotiation" },
  { key: "offer.accepted", label: "Agreements", desc: "When an offer is accepted" },
  { key: "payment.received", label: "Payments", desc: "Escrow funded and payouts released" },
  { key: "submission.approved", label: "Deliveries", desc: "Submitted, approved, or rejected" },
  { key: "verification.approved", label: "Verification", desc: "Verification results" },
];

type Channels = { inApp: boolean; email: boolean };
const defaults: Record<string, Channels> = Object.fromEntries(
  TYPES.map((t) => [t.key, { inApp: true, email: t.key !== "campaign.created" }]),
);

export function NotificationSettings() {
  const [prefs, setPrefs] = useState<Record<string, Channels>>(defaults);

  const set = (key: string, channel: keyof Channels, value: boolean) =>
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [channel]: value } }));

  return (
    <Card className="max-w-2xl gap-0 p-0">
      <div className="border-border border-b px-6 py-4">
        <h3 className="text-sm font-semibold">Notifications</h3>
        <p className="text-muted-foreground text-sm">
          Choose how you&apos;re notified about activity.
        </p>
      </div>
      <ul className="divide-border divide-y">
        {TYPES.map((t) => (
          <li key={t.key} className="flex items-center justify-between gap-4 px-6 py-4">
            <div className="min-w-0">
              <p className="text-sm font-medium">{t.label}</p>
              <p className="text-muted-foreground text-xs">{t.desc}</p>
            </div>
            <div className="flex shrink-0 items-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
                  In-app
                </span>
                <Switch
                  checked={prefs[t.key].inApp}
                  onCheckedChange={(v) => set(t.key, "inApp", v)}
                  aria-label={`${t.label} in-app`}
                />
              </div>
              <div className="flex flex-col items-center gap-1.5">
                <span className="text-muted-foreground text-[10px] tracking-wide uppercase">
                  Email
                </span>
                <Switch
                  checked={prefs[t.key].email}
                  onCheckedChange={(v) => set(t.key, "email", v)}
                  aria-label={`${t.label} email`}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-border border-t px-6 py-4">
        <Button
          variant="brand"
          size="sm"
          onClick={() => toast.success("Notification preferences saved")}
        >
          Save preferences
        </Button>
      </div>
    </Card>
  );
}
