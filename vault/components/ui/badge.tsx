import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Tones carry meaning, so a badge never relies on colour alone — callers pass a
 * word, and status badges additionally pass a glyph. Red/green is precisely the
 * pair a deuteranope cannot separate.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold whitespace-nowrap [&_svg]:size-3",
  {
    variants: {
      tone: {
        gold: "border-gold/30 bg-gold/12 text-gold-lo",
        positive: "border-positive/26 bg-positive/11 text-positive",
        negative: "border-negative/26 bg-negative/11 text-negative",
        warning: "border-warning/26 bg-warning/11 text-warning",
        info: "border-info/26 bg-info/11 text-info",
        muted: "border-line-2 bg-bone/7 text-muted",
      },
    },
    defaultVariants: { tone: "muted" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

export { badgeVariants };
