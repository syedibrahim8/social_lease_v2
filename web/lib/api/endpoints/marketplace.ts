import { apiFetch } from "../client";
import { mockDelay, resolve } from "../adapter";
import {
  mockAssets,
  mockCampaigns,
  myAssets,
  myCampaigns,
  type AssetListing,
  type Campaign,
} from "../mock/marketplace";

export function getCampaigns(): Promise<Campaign[]> {
  return resolve(
    async () => {
      await mockDelay();
      return mockCampaigns;
    },
    async () => (await apiFetch<Campaign[]>("/campaigns")).data,
  );
}

export function getAssets(): Promise<AssetListing[]> {
  return resolve(
    async () => {
      await mockDelay();
      return mockAssets;
    },
    async () => (await apiFetch<AssetListing[]>("/assets")).data,
  );
}

export function getMyCampaigns(): Promise<Campaign[]> {
  return resolve(
    async () => {
      await mockDelay();
      return myCampaigns;
    },
    async () => (await apiFetch<Campaign[]>("/campaigns/mine")).data,
  );
}

export function getMyAssets(): Promise<AssetListing[]> {
  return resolve(
    async () => {
      await mockDelay();
      return myAssets;
    },
    async () => (await apiFetch<AssetListing[]>("/assets/mine")).data,
  );
}
