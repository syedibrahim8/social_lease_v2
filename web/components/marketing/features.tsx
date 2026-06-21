import {
  BadgeCheck,
  BarChart3,
  Compass,
  FileCheck,
  Lock,
  MessagesSquare,
} from "lucide-react";
import { Reveal } from "./reveal";

const features = [
  {
    icon: Lock,
    title: "Escrow payments",
    desc: "Brands fund upfront; funds release to the creator only when the work is approved.",
  },
  {
    icon: BadgeCheck,
    title: "Verified identities",
    desc: "Admin-reviewed creator and brand verification, so you always know who you're dealing with.",
  },
  {
    icon: MessagesSquare,
    title: "Turn-based negotiation",
    desc: "A clear offer thread — counter, accept, or reject with the full history in one place.",
  },
  {
    icon: FileCheck,
    title: "Proof-of-work delivery",
    desc: "Creators submit screenshots, analytics, and links; brands approve to release payout.",
  },
  {
    icon: Compass,
    title: "Creator & asset discovery",
    desc: "Browse campaigns and creator-owned assets with rich filters, search, and availability.",
  },
  {
    icon: BarChart3,
    title: "Analytics that matter",
    desc: "Earnings, spend, conversion, and delivery performance in clean, investor-ready dashboards.",
  },
];

export function Features() {
  return (
    <section id="features" className="scroll-mt-16 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-brand-text text-xs font-semibold tracking-wide uppercase">
            Everything you need
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            One platform from first pitch to final payout
          </h2>
          <p className="text-muted-foreground mt-3 text-base text-balance">
            Built for serious collaborations — secure, transparent, and fast.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.04}>
              <div className="border-border bg-card h-full rounded-xl border p-6">
                <span className="bg-brand-muted text-brand-text flex size-10 items-center justify-center rounded-lg">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="text-muted-foreground mt-1.5 text-sm">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
