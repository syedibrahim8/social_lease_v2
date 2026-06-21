import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

const included = [
  "Escrow-protected payments",
  "Identity & ownership verification",
  "Unlimited campaigns and listings",
  "Negotiation & contracts",
  "Delivery proof & approvals",
  "Analytics dashboards",
];

export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-16 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Reveal className="text-center">
          <p className="text-brand-text text-xs font-semibold tracking-wide uppercase">
            Pricing
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="text-muted-foreground mt-3 text-base text-balance">
            Free to join. No subscriptions or listing fees — you only pay when
            money changes hands.
          </p>
        </Reveal>

        <Reveal delay={0.06}>
          <div className="border-border bg-card mt-10 rounded-2xl border p-8">
            <div className="flex items-baseline gap-2">
              <span className="tabular text-5xl font-semibold tracking-tight">
                10%
              </span>
              <span className="text-muted-foreground text-sm">
                per completed transaction
              </span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              A flat commission on each released payout. That’s it.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {included.map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-sm">
                  <Check className="text-brand-text mt-0.5 size-4 shrink-0" />
                  <span>{x}</span>
                </li>
              ))}
            </ul>
            <Button asChild variant="brand" size="lg" className="mt-8 w-full">
              <Link href="/register">Get started free</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
