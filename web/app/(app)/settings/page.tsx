import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <RoutePlaceholder
      title="Settings"
      description="Profile, security, notifications, payments, and appearance."
      layer="Layer 10"
    />
  );
}
