import type { AuthUser } from "../types";

/**
 * Seed data for the mock adapter. Grows per feature layer. L0 seeds the three
 * personas used by the mock AuthProvider + role switcher.
 */

export interface MockNotification {
  id: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

export const mockNotifications: MockNotification[] = [
  {
    id: "ntf_1",
    title: "New application received",
    body: 'Maya Okonkwo applied to "Summer Launch".',
    read: false,
    createdAt: minutesAgo(18),
  },
  {
    id: "ntf_2",
    title: "Offer countered",
    body: "Northwind Studio countered at $1,500.00.",
    read: false,
    createdAt: minutesAgo(95),
  },
  {
    id: "ntf_3",
    title: "Payment released",
    body: "$1,350.00 was released to your wallet.",
    read: false,
    createdAt: minutesAgo(240),
  },
  {
    id: "ntf_4",
    title: "Verification approved",
    body: "Your profile ownership is now verified.",
    read: true,
    createdAt: minutesAgo(1440),
  },
];

export const mockUsers: Record<AuthUser["role"], AuthUser> = {
  CREATOR: {
    id: "usr_creator_001",
    email: "maya@creatorhq.dev",
    name: "Maya Okonkwo",
    role: "CREATOR",
    isVerified: true,
  },
  BRAND: {
    id: "usr_brand_001",
    email: "ops@northwind.co",
    name: "Northwind Studio",
    role: "BRAND",
    isVerified: true,
  },
  ADMIN: {
    id: "usr_admin_001",
    email: "admin@creatorassets.dev",
    name: "Platform Admin",
    role: "ADMIN",
    isVerified: true,
  },
};
