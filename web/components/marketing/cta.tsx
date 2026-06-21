import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "./reveal";

export function CtaBand() {
  return (
    <section className="px-4 pb-24 sm:px-6">
      <Reveal className="mx-auto max-w-5xl">
        <div className="border-border bg-muted/40 rounded-2xl border px-6 py-14 text-center sm:px-10">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Start your next campaign with confidence
          </h2>
          <p className="text-muted-foreground mx-auto mt-3 max-w-md text-base text-balance">
            Join the brands and creators doing business the secure way.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="brand" size="xl">
              <Link href="/register">
                Get started free
                <ArrowRight />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
