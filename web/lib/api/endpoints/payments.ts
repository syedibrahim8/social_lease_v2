import { apiFetch } from "../client";
import { liveFirst, mockDelay } from "../adapter";

export interface ConnectStatus {
  hasAccount: boolean;
  onboardingComplete: boolean;
  payoutsEnabled: boolean;
}

/** Live Stripe Connect status; mock shows an active account for the demo. */
export function getConnectStatus(): Promise<ConnectStatus> {
  return liveFirst(
    async () => {
      await mockDelay();
      return { hasAccount: true, onboardingComplete: true, payoutsEnabled: true };
    },
    async () => (await apiFetch<ConnectStatus>("/payments/connect/status")).data,
  );
}

/** Creates/refreshes the Stripe onboarding link; returns the hosted URL to redirect to. */
export async function startConnectOnboarding(): Promise<string> {
  const { data } = await apiFetch<{ onboardingUrl: string }>(
    "/payments/connect/onboard",
    { method: "POST" },
  );
  return data.onboardingUrl;
}
