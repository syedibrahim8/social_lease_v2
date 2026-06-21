"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/auth-provider";
import { PageHeader } from "@/components/layout/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreatorAnalytics } from "@/components/analytics/creator-analytics";
import { BrandAnalytics } from "@/components/analytics/brand-analytics";
import { PlatformAnalytics } from "@/components/analytics/platform-analytics";

const RANGES = [
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
];

export default function AnalyticsPage() {
  const { role } = useAuth();
  const [range, setRange] = useState("6m");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description={
          role === "ADMIN"
            ? "Platform performance and growth."
            : role === "BRAND"
              ? "Campaign performance and spend."
              : "Your earnings and performance."
        }
        actions={
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {role === "ADMIN" ? (
        <PlatformAnalytics range={range} />
      ) : role === "BRAND" ? (
        <BrandAnalytics range={range} />
      ) : (
        <CreatorAnalytics range={range} />
      )}
    </div>
  );
}
