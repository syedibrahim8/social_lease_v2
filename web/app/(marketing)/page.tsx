import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { Logos } from "@/components/marketing/logos";
import { Features } from "@/components/marketing/features";
import { HowItWorks } from "@/components/marketing/how-it-works";
import { Audience } from "@/components/marketing/audience";
import { Stats } from "@/components/marketing/stats";
import { Testimonial } from "@/components/marketing/testimonial";
import { Pricing } from "@/components/marketing/pricing";
import { CtaBand } from "@/components/marketing/cta";

export const metadata: Metadata = {
  title: {
    absolute:
      "Creator Asset Marketplace — Campaigns, escrow payments & creator discovery",
  },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Logos />
      <Features />
      <HowItWorks />
      <Audience />
      <Stats />
      <Testimonial />
      <Pricing />
      <CtaBand />
    </>
  );
}
