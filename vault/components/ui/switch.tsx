"use client";

import * as React from "react";
import { Switch as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Switch({ className, ...props }: React.ComponentProps<typeof Primitive.Root>) {
  return (
    <Primitive.Root
      className={cn(
        "border-line-2 bg-bone/8 inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full border p-0.5",
        "transition-colors duration-[var(--duration-fast)]",
        "data-[state=checked]:border-gold/40 data-[state=checked]:bg-gold/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      <Primitive.Thumb
        className={cn(
          "bg-muted block size-4 rounded-full transition-transform duration-[var(--duration-fast)]",
          "data-[state=checked]:bg-gold data-[state=checked]:translate-x-4",
        )}
      />
    </Primitive.Root>
  );
}
