import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { StatStrip } from "@/components/marketing/stat-strip";
import { EscrowWalkthrough } from "@/components/marketing/escrow-walkthrough";
import { Audiences } from "@/components/marketing/audiences";
import { Pricing } from "@/components/marketing/pricing";
import { Questions } from "@/components/marketing/questions";
import { ClosingCta } from "@/components/marketing/closing-cta";

export const metadata: Metadata = {
  // The root layout's template appends "· Vault"; the landing page is the one
  // place that should read as the product name alone.
  title: { absolute: "Vault, escrow backed creator campaigns" },
  description:
    "Brands fund escrow before the work starts. Creators deliver, brands approve, and the payout clears the same day through Stripe.",
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <StatStrip />
      <EscrowWalkthrough />
      <Audiences />
      <Pricing />
      <Questions />
      <ClosingCta />
    </>
  );
}
