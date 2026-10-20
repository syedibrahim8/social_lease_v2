import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The gold SL mark, matching app/icon.svg so the tab and the app agree.
 *
 * `href` defaults to the dashboard because that is where it lives most of the
 * time. The marketing pages pass "/" so the mark returns to the landing page
 * rather than bouncing a signed-out visitor into a guard.
 */
export function Logo({ className, href = "/dashboard" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      // -my-1.5 py-1.5 grows the tap area to 40px without moving the mark:
      // at its natural height this was a 28px target.
      className={cn("-my-1.5 inline-flex items-center gap-2.5 py-1.5", className)}
      aria-label={href === "/" ? "Social Lease, back to the top" : "Social Lease, go to dashboard"}
    >
      <span
        aria-hidden="true"
        className="from-gold-hi grid size-7 place-items-center rounded-lg bg-gradient-to-br to-[#A87C12]"
      >
        <span className="font-display text-[13px] leading-none font-bold tracking-[-0.04em] text-[#14100A]">SL</span>
      </span>
      <span className="font-display text-bone text-[15px] tracking-[0.01em]">Social Lease</span>
    </Link>
  );
}
