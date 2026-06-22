import type { Role } from "@/lib/api/types";

/** Evidence fields a verification type can require. */
export const EVIDENCE_FIELDS = {
  profileUrl: { label: "Profile URL", placeholder: "https://instagram.com/yourhandle", kind: "url" },
  handle: { label: "Handle", placeholder: "@yourhandle", kind: "text" },
  businessEmail: { label: "Business email", placeholder: "you@company.com", kind: "email" },
  website: { label: "Website", placeholder: "https://company.com", kind: "url" },
  documents: { label: "Document URL", placeholder: "https://…/document.pdf", kind: "url" },
  note: { label: "Note", placeholder: "Anything reviewers should know…", kind: "textarea" },
} as const;

export type EvidenceField = keyof typeof EVIDENCE_FIELDS;

export interface VerificationTypeMeta {
  label: string;
  role: Extract<Role, "CREATOR" | "BRAND">;
  description: string;
  evidence: EvidenceField[];
}

/** Typed verification facets (mirrors the verifications module). */
export const VERIFICATION_TYPES: Record<string, VerificationTypeMeta> = {
  SOCIAL_PROFILE: {
    label: "Social profile",
    role: "CREATOR",
    description: "Verify ownership of a social media account.",
    evidence: ["profileUrl", "handle"],
  },
  PROFILE_OWNERSHIP: {
    label: "Profile ownership",
    role: "CREATOR",
    description: "Confirm you control this creator profile.",
    evidence: ["profileUrl", "note"],
  },
  IDENTITY: {
    label: "Identity",
    role: "CREATOR",
    description: "Government ID for identity verification.",
    evidence: ["documents", "note"],
  },
  WEBSITE: {
    label: "Website",
    role: "BRAND",
    description: "Verify your company website.",
    evidence: ["website"],
  },
  BUSINESS_EMAIL: {
    label: "Business email",
    role: "BRAND",
    description: "Verify a business email on your domain.",
    evidence: ["businessEmail"],
  },
  COMPANY: {
    label: "Company registration",
    role: "BRAND",
    description: "Business registration documents.",
    evidence: ["documents", "note"],
  },
};

export function verificationTypesForRole(role: Role): string[] {
  return Object.entries(VERIFICATION_TYPES)
    .filter(([, meta]) => meta.role === role)
    .map(([key]) => key);
}

export function verificationTypeLabel(type: string): string {
  return VERIFICATION_TYPES[type]?.label ?? type;
}
