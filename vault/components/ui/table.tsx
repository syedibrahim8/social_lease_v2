import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * `Table` wraps itself in its own horizontally scrollable container, so a wide
 * ledger scrolls inside its card and the page body never scrolls sideways.
 */
export function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div className="scroll-x border-line-2 rounded-xl border">
      <table className={cn("w-full caption-bottom border-collapse", className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead className={cn("bg-ink-2", className)} {...props} />;
}

export function TBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody {...props} className={className} />;
}

export function TR({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      className={cn("border-line-2 hover:bg-bone/[0.03] border-t transition-colors", className)}
      {...props}
    />
  );
}

export function TH({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      className={cn(
        "text-muted px-4 py-2.5 text-left text-[10px] font-semibold tracking-[0.15em] uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function TD({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td className={cn("text-bone-2 px-4 py-3 text-[13px] align-middle", className)} {...props} />
  );
}
