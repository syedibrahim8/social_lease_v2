import { CountNumber } from "@/components/motion/count-number";

/**
 * Three facts about how the platform actually works, not three invented
 * metrics. Every figure here is checkable in the product: the fee is the
 * commission taken at payout, the funding rule is enforced before a contract
 * can start, and the four steps are the ones the escrow tracker shows.
 */
const FACTS = [
  { value: 10, suffix: "%", label: "Platform fee, taken once, at payout" },
  { value: 100, suffix: "%", label: "Of the contract funded before work starts" },
  { value: 4, suffix: "", label: "Steps from funded to paid" },
];

export function StatStrip() {
  return (
    <section className="border-line-2 border-y">
      <dl className="divide-line-2 mx-auto grid w-full max-w-[1400px] divide-y px-4 sm:px-6 md:grid-cols-3 md:divide-x md:divide-y-0 lg:px-8">
        {FACTS.map((fact) => (
          <div
            key={fact.label}
            // Reversed rather than sr-only-plus-duplicate: the figure reads
            // first, and a screen reader hears the label once.
            className="flex flex-col-reverse px-0 py-8 md:px-8 md:first:pl-0 md:last:pr-0"
          >
            <dt className="text-muted mt-2 max-w-[28ch] text-[13px] leading-snug">{fact.label}</dt>
            <dd className="font-display text-gold-lo text-4xl tracking-tight tabular-nums lg:text-5xl">
              <CountNumber to={fact.value} suffix={fact.suffix} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
