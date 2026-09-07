import { Amount } from "@/components/money/amount";
import { Reveal } from "@/components/motion/reveal";

const CREATOR = [
  "Apply to a campaign and settle the number in one thread.",
  "Attach the proof to the contract when the work is done.",
  "Get paid on approval, into the account Stripe already knows about.",
];

const BRAND = [
  "Post a campaign and read what comes back.",
  "Fund it once. The money sits in escrow, not in anyone's account.",
  "Approve the delivery, or send it back with notes.",
];

function Column({
  heading,
  items,
  figure,
}: {
  heading: string;
  items: string[];
  figure: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="font-display text-bone text-2xl leading-tight tracking-tight">{heading}</h3>
      <ul className="divide-line-2 mt-5 divide-y">
        {items.map((item) => (
          <li key={item} className="text-bone-2 py-3.5 text-[14px] leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
      <div className="mt-6">{figure}</div>
    </div>
  );
}

/**
 * Two audiences, one contract between them. Deliberately not three cards with
 * icons: there are exactly two sides to this marketplace, and a grid that
 * pretends otherwise would be decoration.
 *
 * Each column ends with a real money component rather than an illustration, so
 * the two halves are told apart by what they actually see in the product: the
 * creator reads a payout line, the brand reads a held balance.
 */
export function Audiences() {
  return (
    <section className="border-line-2 border-t py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <h2 className="font-display text-bone max-w-[20ch] text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Two sides, one contract.
          </h2>
        </Reveal>

        <div className="divide-line-2 mt-12 grid gap-10 divide-y lg:grid-cols-2 lg:gap-0 lg:divide-x lg:divide-y-0">
          <Reveal className="lg:pr-12">
            <Column
              heading="If you make the work"
              items={CREATOR}
              figure={
                <div className="border-line-2 flex items-baseline justify-between gap-4 rounded-lg border px-4 py-3">
                  <span className="text-muted text-[11px]">Payout on approval</span>
                  <Amount minor={360_000} signed className="text-[15px]" />
                </div>
              }
            />
          </Reveal>

          <Reveal delay={0.06} className="lg:pl-12">
            <Column
              heading="If you buy the work"
              items={BRAND}
              figure={
                <div className="border-line bg-emerald-lo flex items-baseline justify-between gap-4 rounded-lg border px-4 py-3">
                  <span className="text-muted text-[11px]">Held until approval</span>
                  <Amount minor={400_000} className="text-gold-lo text-[15px]" />
                </div>
              }
            />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
