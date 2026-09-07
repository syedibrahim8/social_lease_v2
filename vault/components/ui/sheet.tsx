"use client";

import * as React from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;

/** Edge-anchored panel. Used for the mobile navigation drawer. */
export function SheetContent({
  className,
  children,
  title,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & { title: string }) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-[2px]" />
      <SheetPrimitive.Content
        className={cn(
          "bg-ink-2 border-line-2 fixed inset-y-0 left-0 z-50 w-72 border-r p-4",
          "data-[state=open]:animate-in data-[state=open]:slide-in-from-left",
          "data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left",
          className,
        )}
        {...props}
      >
        {/* Radix requires an accessible title; ours is visually carried by the
            brand mark, so it is provided here for screen readers only. */}
        <SheetPrimitive.Title className="sr-only">{title}</SheetPrimitive.Title>
        <SheetPrimitive.Close
          className="text-muted hover:text-bone absolute top-4 right-4 rounded"
          aria-label="Close navigation"
        >
          <X className="size-4" />
        </SheetPrimitive.Close>
        {children}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}
