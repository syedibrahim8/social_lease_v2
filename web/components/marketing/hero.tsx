"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroPreview } from "./hero-preview";
import { fade, slideUp, staggerContainer } from "@/lib/motion";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-4 pt-32 pb-16 sm:px-6 sm:pt-36">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-3xl text-center"
      >
        <motion.div variants={slideUp}>
          <span className="border-border bg-muted/60 text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
            <ShieldCheck className="text-brand-text size-3.5" />
            Escrow-protected payments via Stripe Connect
          </span>
        </motion.div>

        <motion.h1
          variants={slideUp}
          className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-5xl md:text-6xl"
        >
          Where brands and creators do business with confidence
        </motion.h1>

        <motion.p
          variants={slideUp}
          className="text-muted-foreground mx-auto mt-5 max-w-xl text-base text-balance sm:text-lg"
        >
          Post campaigns, discover verified creators, negotiate terms, deliver proof
          of work, and release payment from escrow — all in one place.
        </motion.p>

        <motion.div
          variants={slideUp}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <Button asChild variant="brand" size="xl">
            <Link href="/register">
              Get started free
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="xl">
            <Link href="#how">See how it works</Link>
          </Button>
        </motion.div>

        <motion.p variants={fade} className="text-muted-foreground mt-4 text-xs">
          No credit card required · 10% flat commission · Cancel anytime
        </motion.p>
      </motion.div>

      <motion.div
        variants={fade}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.15 }}
        className="mx-auto mt-14 max-w-4xl"
      >
        <HeroPreview />
      </motion.div>
    </section>
  );
}
