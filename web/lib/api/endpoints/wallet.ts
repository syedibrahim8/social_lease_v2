import { apiFetch } from "../client";
import { mockDelay, resolve } from "../adapter";
import {
  brandTransactions,
  brandWallet,
  creatorTransactions,
  creatorWallet,
  type BrandWallet,
  type CreatorWallet,
  type Transaction,
} from "../mock/wallet";

export function getCreatorWallet(): Promise<CreatorWallet> {
  return resolve(
    async () => {
      await mockDelay();
      return creatorWallet;
    },
    async () => (await apiFetch<CreatorWallet>("/payments/wallet")).data,
  );
}

export function getBrandWallet(): Promise<BrandWallet> {
  return resolve(
    async () => {
      await mockDelay();
      return brandWallet;
    },
    async () => (await apiFetch<BrandWallet>("/analytics/brand")).data,
  );
}

export function getCreatorTransactions(): Promise<Transaction[]> {
  return resolve(
    async () => {
      await mockDelay();
      return creatorTransactions;
    },
    async () => (await apiFetch<Transaction[]>("/payments/transactions")).data,
  );
}

export function getBrandTransactions(): Promise<Transaction[]> {
  return resolve(
    async () => {
      await mockDelay();
      return brandTransactions;
    },
    async () => (await apiFetch<Transaction[]>("/payments/transactions")).data,
  );
}
