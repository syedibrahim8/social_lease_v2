import { apiFetch } from "../client";
import { mockDelay, resolve } from "../adapter";
import {
  adminDashboard,
  brandDashboard,
  creatorDashboard,
  type AdminDashboard,
  type BrandDashboard,
  type CreatorDashboard,
} from "../mock/dashboards";

export function getCreatorDashboard(): Promise<CreatorDashboard> {
  return resolve(
    async () => {
      await mockDelay();
      return creatorDashboard;
    },
    async () => (await apiFetch<CreatorDashboard>("/analytics/creator")).data,
  );
}

export function getBrandDashboard(): Promise<BrandDashboard> {
  return resolve(
    async () => {
      await mockDelay();
      return brandDashboard;
    },
    async () => (await apiFetch<BrandDashboard>("/analytics/brand")).data,
  );
}

export function getAdminDashboard(): Promise<AdminDashboard> {
  return resolve(
    async () => {
      await mockDelay();
      return adminDashboard;
    },
    async () => (await apiFetch<AdminDashboard>("/analytics/platform")).data,
  );
}
