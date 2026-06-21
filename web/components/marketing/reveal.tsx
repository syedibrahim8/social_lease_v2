"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { slideUp } from "@/lib/motion";

/** Subtle on-scroll reveal for marketing sections (fires once when in view). */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={slideUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}
