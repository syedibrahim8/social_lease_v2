"use client";

import * as React from "react";
import { Accordion as Primitive } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Disclosure rows. Used on the landing page's questions section.
 *
 * The height animation is CSS keyframes rather than a JS spring: it is a
 * predetermined open/close, so it belongs off the main thread, and CSS
 * transitions cannot animate to `auto` height. Radix supplies the measured
 * height as --radix-accordion-content-height.
 */
export const Accordion = Primitive.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Item>) {
  return <Primitive.Item className={cn("border-line-2 border-b", className)} {...props} />;
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Header className="flex">
      <Primitive.Trigger
        className={cn(
          "group text-bone flex flex-1 items-center justify-between gap-4 py-5 text-left",
          "text-[15px] leading-snug font-medium",
          "transition-colors duration-[var(--duration-fast)] hover:text-gold-lo",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "text-muted size-4 shrink-0",
            "transition-transform duration-[var(--duration-base)] ease-[var(--ease-out-vault)]",
            "group-data-[state=open]:rotate-180",
          )}
        />
      </Primitive.Trigger>
    </Primitive.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      className={cn(
        "overflow-hidden",
        "data-[state=open]:animate-[vault-accordion-down_240ms_var(--ease-out-vault)]",
        "data-[state=closed]:animate-[vault-accordion-up_180ms_var(--ease-out-vault)]",
      )}
      {...props}
    >
      <div className={cn("text-bone-2 max-w-[62ch] pb-5 text-[13px] leading-relaxed", className)}>
        {children}
      </div>
    </Primitive.Content>
  );
}
