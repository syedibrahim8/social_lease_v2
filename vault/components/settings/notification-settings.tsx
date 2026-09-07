"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardBody } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { ApiError } from "@/lib/api/client";
import { getPreferences, updatePreferences } from "@/lib/api/endpoints/notifications";
import { NOTIFICATION_TYPES, type NotificationType } from "@/lib/api/types";
import { invalidateFor, qk } from "@/lib/query";

const TYPE_LABEL: Record<NotificationType, string> = {
  CAMPAIGN_CREATED: "New campaigns posted",
  APPLICATION_RECEIVED: "Applications to your campaigns",
  OFFER_RECEIVED: "Offers and counter-offers",
  OFFER_ACCEPTED: "Offers accepted",
  PAYMENT_RECEIVED: "Escrow funded",
  SUBMISSION_APPROVED: "Deliveries approved",
  VERIFICATION_APPROVED: "Verification results",
  ANNOUNCEMENT: "Announcements",
};

/** Money events people almost never want silenced. */
const MONEY_TYPES = new Set<NotificationType>(["PAYMENT_RECEIVED", "SUBMISSION_APPROVED"]);

export function NotificationSettings() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.notificationPreferences(),
    queryFn: getPreferences,
  });

  const save = useMutation({
    mutationFn: updatePreferences,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.notificationPreferences() });
      invalidateFor(queryClient, "notification");
      toast.success("Preferences saved.");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof ApiError ? e.message : "Could not save your preferences."),
  });

  return (
    <QueryBoundary
      query={query}
      skeleton={
        <Card>
          <CardBody className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-9 w-full" />
            ))}
          </CardBody>
        </Card>
      }
    >
      {(prefs) => {
        const mutedInApp = new Set(prefs.mutedInApp);
        const mutedEmail = new Set(prefs.mutedEmail);

        const toggleMute = (channel: "inApp" | "email", type: NotificationType) => {
          const current = channel === "inApp" ? mutedInApp : mutedEmail;
          const next = new Set(current);
          if (next.has(type)) next.delete(type);
          else next.add(type);
          save.mutate(
            channel === "inApp" ? { mutedInApp: [...next] } : { mutedEmail: [...next] },
          );
        };

        return (
          <div className="space-y-4">
            <Card>
              <CardBody className="space-y-3">
                <p className="text-bone text-[13px] font-medium">Channels</p>
                <Row
                  label="In-app"
                  hint="The bell, the notifications screen, and live updates."
                  checked={prefs.inAppEnabled}
                  onChange={(v) => save.mutate({ inAppEnabled: v })}
                />
                <Row
                  label="Email"
                  hint="Sent to the address on your account."
                  checked={prefs.emailEnabled}
                  onChange={(v) => save.mutate({ emailEnabled: v })}
                />
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <p className="text-bone text-[13px] font-medium">What you hear about</p>
                <p className="text-muted mt-1 mb-4 text-xs leading-relaxed">
                  Turn off anything you would rather not be told. Money events are worth
                  keeping on.
                </p>

                <div className="scroll-x">
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className="text-faint pb-2 text-left text-[10px] tracking-[0.14em] uppercase">
                          Event
                        </th>
                        <th className="text-faint w-20 pb-2 text-[10px] tracking-[0.14em] uppercase">
                          In-app
                        </th>
                        <th className="text-faint w-20 pb-2 text-[10px] tracking-[0.14em] uppercase">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {NOTIFICATION_TYPES.map((type) => (
                        <tr key={type} className="border-line-2 border-t">
                          <td className="py-2.5">
                            <span className="text-bone-2 text-[13px]">{TYPE_LABEL[type]}</span>
                            {MONEY_TYPES.has(type) ? (
                              <span className="text-gold-lo ml-2 text-[10px]"> money</span>
                            ) : null}
                          </td>
                          <td className="py-2.5 text-center">
                            <Switch
                              aria-label={`${TYPE_LABEL[type]} in-app`}
                              checked={!mutedInApp.has(type)}
                              disabled={!prefs.inAppEnabled || save.isPending}
                              onCheckedChange={() => toggleMute("inApp", type)}
                            />
                          </td>
                          <td className="py-2.5 text-center">
                            <Switch
                              aria-label={`${TYPE_LABEL[type]} email`}
                              checked={!mutedEmail.has(type)}
                              disabled={!prefs.emailEnabled || save.isPending}
                              onCheckedChange={() => toggleMute("email", type)}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardBody>
            </Card>
          </div>
        );
      }}
    </QueryBoundary>
  );
}

function Row({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="border-line-2 flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5">
      <div className="min-w-0">
        <p className="text-bone-2 text-[13px]">{label}</p>
        <p className="text-muted mt-0.5 text-[11px]">{hint}</p>
      </div>
      <Switch aria-label={label} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
