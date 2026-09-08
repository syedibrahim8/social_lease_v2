import { Amount } from "@/components/money/amount";
import { Reveal } from "@/components/motion/reveal";

const ROWS: { label: string; minor: number; emphasis?: boolean }[] = [
  { label: "Contract value", minor: 400_000 },
  { label: "Platform fee, 10%", minor: -40_000 },
  { label: "Creator receives", minor: 360_000, emphasis: true },
];

/**
 * The real commission, worked through on a real number. A pricing section that
 * says "10%" and stops makes the reader do the arithmetic that decides whether
 * they sign up, so it is done for them here, in the same mono figures the
 * ledger uses.
 */
export function Pricing() {
  return (
    <section id="pricing" className="scroll-mt-20 py-20 lg:py-28">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="border-line from-emerald-deep grid gap-10 rounded-2xl border bg-gradient-to-br to-[#0B1513] p-8 sm:p-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
            <div>
              <p className="font-display text-gold-lo text-7xl leading-none tracking-tight tabular-nums sm:text-8xl">
                10%
              </p>
              <h2 className="font-display text-bone mt-6 text-2xl leading-tight tracking-tight sm:text-3xl">
                One fee, taken at payout.
              </h2>
              <p className="text-bone-2 mt-3 max-w-[42ch] text-[14px] leading-relaxed">
                Browsing, applying and negotiating cost nothing. The fee comes out of the transfer,
                and only when the transfer actually happens.
              </p>
            </div>

            <dl className="divide-line divide-y">
              {ROWS.map((row) => (
                <div key={row.label} className="flex items-baseline justify-between gap-6 py-4">
                  <dt
                    className={
                      row.emphasis ? "text-bone text-[14px] font-medium" : "text-bone-2 text-[14px]"
                    }
                  >
                    {row.label}
                  </dt>
                  <dd>
                    <Amount
                      minor={row.minor}
                      className={
                        row.emphasis
                          ? "text-gold-lo text-lg"
                          : row.minor < 0
                            ? "text-muted text-[15px]"
                            : "text-bone-2 text-[15px]"
                      }
                    />
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
