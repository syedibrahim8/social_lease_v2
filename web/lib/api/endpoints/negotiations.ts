import { apiFetch } from "../client";
import { mockDelay, resolve } from "../adapter";
import { mockNegotiations, type Negotiation } from "../mock/negotiations";

export function getNegotiations(): Promise<Negotiation[]> {
  return resolve(
    async () => {
      await mockDelay();
      return mockNegotiations;
    },
    async () => (await apiFetch<Negotiation[]>("/applications/mine")).data,
  );
}

export function getNegotiation(id: string): Promise<Negotiation | undefined> {
  return resolve(
    async () => {
      await mockDelay();
      return mockNegotiations.find((n) => n.id === id);
    },
    async () => (await apiFetch<Negotiation>(`/applications/${id}`)).data,
  );
}
