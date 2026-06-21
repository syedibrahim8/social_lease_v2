import { apiFetch } from "../client";
import { mockDelay, resolve } from "../adapter";
import {
  brandAnalytics,
  creatorAnalytics,
  platformAnalytics,
  type BrandAnalytics,
  type CreatorAnalytics,
  type PlatformAnalytics,
} from "../mock/analytics";

export function getCreatorAnalytics(): Promise<CreatorAnalytics> {
  return resolve(
    async () => {
      await mockDelay();
      return creatorAnalytics;
    },
    async () => (await apiFetch<CreatorAnalytics>("/analytics/creator")).data,
  );
}

export function getBrandAnalytics(): Promise<BrandAnalytics> {
  return resolve(
    async () => {
      await mockDelay();
      return brandAnalytics;
    },
    async () => (await apiFetch<BrandAnalytics>("/analytics/brand")).data,
  );
}

export function getPlatformAnalytics(): Promise<PlatformAnalytics> {
  return resolve(
    async () => {
      await mockDelay();
      return platformAnalytics;
    },
    async () => (await apiFetch<PlatformAnalytics>("/analytics/platform")).data,
  );
}
