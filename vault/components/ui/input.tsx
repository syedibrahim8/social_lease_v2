"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase = [
  "w-full rounded-lg border border-line-2 bg-surface px-3 text-[13px] text-bone",
  "placeholder:text-faint transition-colors",
  "hover:border-bone/18",
  "focus:border-gold/45",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "aria-[invalid=true]:border-negative/60",
].join(" ");

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    // h-10 (40px) is the minimum comfortable target; money forms are not the
    // place to be clever about density.
    <input data-slot="input" className={cn(fieldBase, "h-10", className)} {...props} />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(fieldBase, "min-h-24 resize-y py-2.5 leading-relaxed", className)}
      {...props}
    />
  );
}
