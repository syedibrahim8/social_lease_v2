import { apiFetch } from "../client";
import { mockDelay, resolve } from "../adapter";
import {
  allVerifications,
  myVerifications,
  type VerificationRequest,
} from "../mock/verifications";

export function getMyVerifications(): Promise<VerificationRequest[]> {
  return resolve(
    async () => {
      await mockDelay();
      return myVerifications;
    },
    async () => (await apiFetch<VerificationRequest[]>("/verifications/mine")).data,
  );
}

export function getAllVerifications(): Promise<VerificationRequest[]> {
  return resolve(
    async () => {
      await mockDelay();
      return allVerifications;
    },
    async () => (await apiFetch<VerificationRequest[]>("/verifications")).data,
  );
}
