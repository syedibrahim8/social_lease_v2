import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * The "back to the list" link on every detail screen.
 *
 * `-my-1.5 py-1.5` grows the tap area to 40px without shifting the text: at its
 * natural line height this was a 16px target, which is unpleasant on a phone
 * and is the control people reach for most often on a detail page.
 */
export function BackLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="text-muted hover:text-bone -my-1.5 mb-4 inline-flex items-center gap-1.5 py-1.5 text-xs transition-colors"
    >
      <ArrowLeft className="size-3.5" aria-hidden="true" />
      {children}
    </Link>
  );
}
