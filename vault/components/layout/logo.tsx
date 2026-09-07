import Link from "next/link";
import { cn } from "@/lib/utils";

/** The gold V mark, matching app/icon.svg so the tab and the app agree. */
export function Logo({ className }: { className?: string }) {
  return (
    <Link
      href="/dashboard"
      // -my-1.5 py-1.5 grows the tap area to 40px without moving the mark:
      // at its natural height this was a 28px target.
      className={cn("-my-1.5 inline-flex items-center gap-2.5 py-1.5", className)}
      aria-label="Vault, go to dashboard"
    >
      <span
        aria-hidden="true"
        className="from-gold-hi grid size-7 place-items-center rounded-lg bg-gradient-to-br to-[#A87C12]"
      >
        <span className="font-display text-[13px] leading-none font-bold text-[#14100A]">V</span>
      </span>
      <span className="font-display text-bone text-[15px] tracking-[0.01em]">Vault</span>
    </Link>
  );
}
