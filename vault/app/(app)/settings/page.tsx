"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardBody } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ProfileSettings } from "@/components/settings/profile-settings";
import { SecuritySettings } from "@/components/settings/security-settings";
import { NotificationSettings } from "@/components/settings/notification-settings";
import { ConnectStatusCard } from "@/components/wallet/connect-status-card";
import { ReachSettings } from "@/components/settings/reach-settings";
import { EmptyState } from "@/components/feedback/empty-state";
import { useMyProfile } from "@/lib/auth/use-profile";
import { Radio } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-provider";

function TabSkeleton() {
  return (
    <Card>
      <CardBody className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
      </CardBody>
    </Card>
  );
}

/** Channels need a profile to hang off; until onboarding, point there. */
function ChannelsTab() {
  const { creatorProfile, isPending } = useMyProfile();
  if (isPending) return <TabSkeleton />;
  if (!creatorProfile) {
    return (
      <EmptyState
        icon={Radio}
        title="Set up your profile first"
        description="Your channels and audience numbers are part of your creator profile."
      />
    );
  }
  return <ReachSettings profile={creatorProfile} />;
}

function SettingsBody() {
  const { role } = useAuth();
  const isCreator = role === "CREATOR";
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // The tab lives in the URL so a settings screen can be linked to directly —
  // "go to your payout settings" should be a link, not an instruction.
  const tab = params.get("tab") ?? "profile";
  const setTab = (next: string) => {
    const q = new URLSearchParams(params.toString());
    if (next === "profile") q.delete("tab");
    else q.set("tab", next);
    router.replace(`${pathname}?${q.toString()}`, { scroll: false });
  };

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="profile">Profile</TabsTrigger>
        {isCreator ? <TabsTrigger value="channels">Channels</TabsTrigger> : null}
        <TabsTrigger value="security">Security</TabsTrigger>
        {isCreator ? <TabsTrigger value="payouts">Payouts</TabsTrigger> : null}
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <ProfileSettings isCreator={isCreator} />
      </TabsContent>

      {isCreator ? (
        <TabsContent value="channels">
          <ChannelsTab />
        </TabsContent>
      ) : null}

      <TabsContent value="security">
        <SecuritySettings />
      </TabsContent>

      {isCreator ? (
        <TabsContent value="payouts">
          <div className="space-y-4">
            <ConnectStatusCard />
            <Card>
              <CardBody>
                <p className="text-muted text-xs leading-relaxed">
                  Social Lease never holds your bank details. Stripe does, and money released from
                  escrow goes straight to the account you connected there. Balances and the
                  full ledger live on the wallet screen.
                </p>
              </CardBody>
            </Card>
          </div>
        </TabsContent>
      ) : null}

      <TabsContent value="notifications">
        <NotificationSettings />
      </TabsContent>
    </Tabs>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Your profile, sign-in, payouts and what we tell you about." />
      <Suspense fallback={<TabSkeleton />}>
        <SettingsBody />
      </Suspense>
    </>
  );
}
