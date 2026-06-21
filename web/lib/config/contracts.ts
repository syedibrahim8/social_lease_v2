/** Proof item types for delivery submissions (mirrors the submissions module). */
export const PROOF_TYPES = [
  { value: "SCREENSHOT", label: "Screenshot" },
  { value: "ANALYTICS_SCREENSHOT", label: "Analytics screenshot" },
  { value: "DOCUMENT", label: "Document" },
  { value: "LINK", label: "Link" },
] as const;

export type ProofType = (typeof PROOF_TYPES)[number]["value"];

export function proofTypeLabel(type: ProofType): string {
  return PROOF_TYPES.find((p) => p.value === type)?.label ?? type;
}
