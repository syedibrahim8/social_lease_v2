import { apiFetch } from "../client";
import { mockDelay, resolve } from "../adapter";

/**
 * Worked example of the endpoint pattern: mock now, one-line flip to live.
 * Real modules (campaigns, wallet, …) follow this exact shape per layer.
 */

export interface HealthStatus {
  status: "ok";
  uptimeLabel: string;
}

export function getHealth(): Promise<HealthStatus> {
  return resolve(
    async () => {
      await mockDelay(120);
      return { status: "ok", uptimeLabel: "operational" };
    },
    async () => {
      const { data } = await apiFetch<HealthStatus>("/health");
      return data;
    },
  );
}
