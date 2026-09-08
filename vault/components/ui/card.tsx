import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * On a dark ground, depth reads as border and glow rather than drop shadow.
 * `tone="money"` switches the card onto the emerald surface with a gold
 * hairline — reserved for balances, escrow and contract value, so the surface
 * itself tells you what kind of information you are looking at.
 */
export function Card({
  className,
  tone = "default",
  ...props
}: React.ComponentProps<"div"> & { tone?: "default" | "money" }) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-xl border",
        tone === "money"
          ? "border-line bg-gradient-to-br from-emerald-deep to-[#0C1614]"
          : "border-line-2 bg-surface",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1 px-5 pt-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      className={cn("font-display text-bone text-base leading-tight", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return <p className={cn("text-muted text-xs leading-relaxed", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-5 py-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("border-line-2 flex items-center gap-2 border-t px-5 py-4", className)}
      {...props}
    />
  );
}
