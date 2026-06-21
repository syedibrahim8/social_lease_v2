import { Reveal } from "./reveal";

const steps = [
  {
    n: "01",
    title: "Post or discover",
    desc: "Brands post campaigns; creators list assets and browse opportunities that fit.",
  },
  {
    n: "02",
    title: "Negotiate terms",
    desc: "Agree on price and deliverables through a transparent, turn-based offer thread.",
  },
  {
    n: "03",
    title: "Fund escrow",
    desc: "The brand funds the contract and the money is held securely until the work is approved.",
  },
  {
    n: "04",
    title: "Deliver & get paid",
    desc: "Creators submit proof of work; on approval, the payout releases automatically.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-muted/40 scroll-mt-16 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-brand-text text-xs font-semibold tracking-wide uppercase">
            How it works
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            From handshake to payout in four steps
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.05}>
              <div className="relative">
                <span className="tabular text-brand-text/30 text-3xl font-semibold">
                  {s.n}
                </span>
                <h3 className="mt-2 text-base font-semibold">{s.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm">{s.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
