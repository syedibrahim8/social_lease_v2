"use client";

import * as React from "react";
import { Tabs as Primitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const Tabs = Primitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof Primitive.List>) {
  return (
    <Primitive.List
      // Scrolls rather than wraps or squashes on a narrow screen.
      className={cn("scroll-x border-line-2 flex gap-1 border-b pb-px", className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={cn(
        "text-muted hover:text-bone relative min-h-10 shrink-0 px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
        "data-[state=active]:text-gold-lo",
        // The active rule sits on the shared bottom border.
        "after:bg-gold after:absolute after:inset-x-2 after:-bottom-px after:h-px after:opacity-0",
        "data-[state=active]:after:opacity-100",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return <Primitive.Content className={cn("pt-6 outline-none", className)} {...props} />;
}
