import type { Role, VerificationStatus } from "@/lib/api/types";

const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString();

export interface VerificationEvidence {
  profileUrl?: string;
  handle?: string;
  businessEmail?: string;
  website?: string;
  documents?: string[];
  note?: string;
}

export interface VerificationRequest {
  id: string;
  verificationType: string;
  role: Extract<Role, "CREATOR" | "BRAND">;
  submitterName: string;
  status: VerificationStatus;
  evidence: VerificationEvidence;
  createdAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

/** The current user's own verification requests (creator perspective). */
export const myVerifications: VerificationRequest[] = [
  {
    id: "ver_1", verificationType: "SOCIAL_PROFILE", role: "CREATOR",
    submitterName: "Maya Okonkwo", status: "APPROVED",
    evidence: { profileUrl: "https://instagram.com/mayacreates", handle: "@mayacreates" },
    createdAt: daysAgo(20), reviewedAt: daysAgo(18),
  },
  {
    id: "ver_2", verificationType: "IDENTITY", role: "CREATOR",
    submitterName: "Maya Okonkwo", status: "PENDING",
    evidence: { documents: ["https://example.com/id.pdf"], note: "Passport." },
    createdAt: daysAgo(2),
  },
];

/** All requests across users for the admin review queue. */
export const allVerifications: VerificationRequest[] = [
  {
    id: "ver_10", verificationType: "PROFILE_OWNERSHIP", role: "CREATOR",
    submitterName: "Devon Pierce", status: "PENDING",
    evidence: { profileUrl: "https://tiktok.com/@devonp", note: "Primary account." },
    createdAt: daysAgo(1),
  },
  {
    id: "ver_11", verificationType: "WEBSITE", role: "BRAND",
    submitterName: "Lumen", status: "PENDING",
    evidence: { website: "https://lumen.co" },
    createdAt: daysAgo(1),
  },
  {
    id: "ver_12", verificationType: "BUSINESS_EMAIL", role: "BRAND",
    submitterName: "Northwind Studio", status: "PENDING",
    evidence: { businessEmail: "ops@northwind.co" },
    createdAt: daysAgo(2),
  },
  {
    id: "ver_13", verificationType: "IDENTITY", role: "CREATOR",
    submitterName: "Maya Okonkwo", status: "PENDING",
    evidence: { documents: ["https://example.com/id.pdf"], note: "Passport." },
    createdAt: daysAgo(2),
  },
  {
    id: "ver_14", verificationType: "SOCIAL_PROFILE", role: "CREATOR",
    submitterName: "Theo Marsh", status: "APPROVED",
    evidence: { profileUrl: "https://instagram.com/theomarsh", handle: "@theomarsh" },
    createdAt: daysAgo(6), reviewedAt: daysAgo(5),
  },
  {
    id: "ver_15", verificationType: "COMPANY", role: "BRAND",
    submitterName: "Vertex", status: "REJECTED",
    evidence: { documents: ["https://example.com/cert.pdf"] },
    createdAt: daysAgo(9), reviewedAt: daysAgo(7),
    reviewNote: "Document was illegible — please re-upload a clearer copy.",
  },
];
