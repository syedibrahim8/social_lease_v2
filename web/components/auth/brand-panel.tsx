import { BadgeCheck, Lock, ShieldCheck } from "lucide-react";
import { LayoutGrid } from "lucide-react";

const points = [
  { icon: Lock, text: "Escrow-protected payments, released only on approval" },
  { icon: BadgeCheck, text: "Verified creators and brands you can trust" },
  { icon: ShieldCheck, text: "Transparent, turn-based negotiation" },
];

/** The quiet, premium panel beside the auth forms (lg+). Always dark. */
export function AuthBrandPanel() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-[#0B0F19] p-12 text-white lg:flex">
      <div className="flex items-center gap-2.5">
        <span className="bg-brand flex size-7 items-center justify-center rounded-lg">
          <LayoutGrid className="size-4 text-white" />
        </span>
        <span className="text-sm font-semibold">Creator Market</span>
      </div>

      <div className="max-w-md">
        <h2 className="text-3xl font-semibold tracking-tight text-balance">
          The marketplace where brands and creators do business with confidence.
        </h2>
        <ul className="mt-8 space-y-4">
          {points.map((p) => (
            <li key={p.text} className="flex items-start gap-3">
              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/10">
                <p.icon className="size-4 text-[#34D399]" />
              </span>
              <span className="text-sm text-white/80">{p.text}</span>
            </li>
          ))}
        </ul>
      </div>

      <figure className="border-t border-white/10 pt-6">
        <blockquote className="text-sm text-white/80">
          “We funded our first campaign and released payout the same week. The
          escrow flow made it effortless to trust a creator we’d never worked
          with.”
        </blockquote>
        <figcaption className="mt-3 text-xs text-white/50">
          Operations Lead · Northwind Studio
        </figcaption>
      </figure>
    </div>
  );
}
