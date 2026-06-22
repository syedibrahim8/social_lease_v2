"use client";

import { PageHeader } from "@/components/layout/page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { PaymentSettings } from "@/components/settings/payment-settings";
import { AppearanceSettings } from "@/components/settings/appearance-settings";

const tabs = [
  { value: "profile", label: "Profile" },
  { value: "security", label: "Security" },
  { value: "notifications", label: "Notifications" },
  { value: "payments", label: "Payments" },
  { value: "appearance", label: "Appearance" },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your profile, security, and preferences."
      />

      <Tabs defaultValue="profile">
        <TabsList className="max-w-full overflow-x-auto">
          {tabs.map((t) => (
            <TabsTrigger key={t.value} value={t.value}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <ProfileSettings />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <SecuritySettings />
        </TabsContent>
        <TabsContent value="notifications" className="mt-6">
          <NotificationSettings />
        </TabsContent>
        <TabsContent value="payments" className="mt-6">
          <PaymentSettings />
        </TabsContent>
        <TabsContent value="appearance" className="mt-6">
          <AppearanceSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
