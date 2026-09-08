import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/motion/reveal";

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="from-emerald-lo absolute inset-0 bg-gradient-to-b to-transparent"
      />
      <div className="relative mx-auto w-full max-w-[1400px] px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
        <Reveal>
          <h2 className="font-display text-bone mx-auto max-w-[18ch] text-4xl leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Put the money in first.
          </h2>
          <p className="text-bone-2 mx-auto mt-5 max-w-[46ch] text-[15px] leading-relaxed">
            It takes a minute to open an account, and nothing is charged until a contract is funded.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="gold" size="lg">
              <Link href="/register">Get started</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
