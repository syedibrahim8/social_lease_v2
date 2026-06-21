import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

const groups = [
  {
    label: "For Brands",
    title: "Find the right creators, fund with confidence",
    points: [
      "Discover verified creators with rich filters and analytics",
      "Escrow protects your budget until work is approved",
      "Negotiate transparently and track every contract",
      "Measure spend, performance, and delivery ROI",
    ],
    cta: { label: "Start a campaign", href: "/register" },
  },
  {
    label: "For Creators",
    title: "Get discovered, and get paid on time",
    points: [
      "Browse campaigns that match your niche and audience",
      "Escrow guarantees you're paid for approved work",
      "Build a verified reputation that wins more deals",
      "Fast payouts straight to your Stripe account",
    ],
    cta: { label: "Create your profile", href: "/register" },
  },
];

export function Audience() {
  return (
    <section className="px-4 py-20 sm:px-6">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
        {groups.map((g, i) => (
          <Reveal key={g.label} delay={i * 0.06}>
            <div className="border-border bg-card flex h-full flex-col rounded-2xl border p-8">
              <p className="text-brand-text text-xs font-semibold tracking-wide uppercase">
                {g.label}
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-balance">
                {g.title}
              </h3>
              <ul className="mt-6 space-y-3">
                {g.points.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm">
                    <Check className="text-brand-text mt-0.5 size-4 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Button asChild variant="outline">
                  <Link href={g.cta.href}>{g.cta.label}</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
