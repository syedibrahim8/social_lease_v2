import type { Metadata } from "next";
import { RoutePlaceholder } from "@/components/layout/route-placeholder";

export const metadata: Metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <RoutePlaceholder
      title="Notifications"
      description="Everything that needs your attention."
      layer="Layer 10"
    />
  );
}
