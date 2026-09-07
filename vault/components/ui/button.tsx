"use client";

import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Variants map to intent, not to colour:
 *
 *   gold   — the money action. AT MOST ONE PER SCREEN. Fund, release, approve.
 *   ghost  — a real alternative to the primary action (request revision, cancel a flow).
 *   quiet  — tertiary; navigation-ish actions that shouldn't compete.
 *   danger — destructive and irreversible (refund, delete).
 *
 * The gold variant is deliberately awkward to reach for twice: if two on one
 * screen both look primary, neither is.
 */
const buttonVariants = cva(
  [
    "relative inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap",
    "rounded-lg font-semibold",
    // Named properties only — `transition: all` would also animate layout
    // properties, which cannot run on the GPU.
    "transition-[transform,background-color,border-color,color] duration-[var(--duration-press)]",
    "ease-[var(--ease-out-vault)]",
    // Press feedback. The interface must visibly acknowledge the press before
    // the network does — especially here, where the next thing that happens is
    // money moving. Subtle: 0.97, not a bounce.
    "active:scale-[0.97]",
    "disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ].join(" "),
  {
    variants: {
      variant: {
        gold: "sheen bg-gradient-to-b from-gold-lo to-[#B8901D] text-[#15100A] shadow-[var(--shadow-gold)] hover:to-[#C99C1F]",
        ghost:
          "border border-bone/20 text-bone hover:border-bone/35 hover:bg-bone/5",
        quiet: "bg-bone/7 text-bone-2 hover:bg-bone/12 hover:text-bone",
        danger:
          "border border-negative/35 text-negative hover:bg-negative/10 hover:border-negative/55",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
        md: "h-10 px-4 text-[13px] [&_svg]:size-4",
        lg: "h-12 px-6 text-sm [&_svg]:size-4",
        icon: "size-9 [&_svg]:size-4",
      },
    },
    defaultVariants: { variant: "quiet", size: "md" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {/*
        The label keeps its box and only loses opacity, so the button cannot
        change width mid-action. A "Release payout" button that shrinks while
        the transfer is in flight reads as broken at the worst possible moment.
      */}
      <span className={cn("contents", loading && "invisible")}>{children}</span>
      {loading ? (
        <span className="absolute inset-0 grid place-items-center">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        </span>
      ) : null}
    </Comp>
  );
}

export { buttonVariants };
