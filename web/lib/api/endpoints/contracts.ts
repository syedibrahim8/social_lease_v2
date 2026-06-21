import { apiFetch } from "../client";
import { mockDelay, resolve } from "../adapter";
import { mockContracts, type Contract } from "../mock/contracts";

export function getContracts(): Promise<Contract[]> {
  return resolve(
    async () => {
      await mockDelay();
      return mockContracts;
    },
    async () => (await apiFetch<Contract[]>("/contracts")).data,
  );
}

export function getContract(id: string): Promise<Contract | undefined> {
  return resolve(
    async () => {
      await mockDelay();
      return mockContracts.find((c) => c.id === id);
    },
    async () => (await apiFetch<Contract>(`/contracts/${id}`)).data,
  );
}
