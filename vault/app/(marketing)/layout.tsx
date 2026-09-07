import type { ReactNode } from "react";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { MarketingFooter } from "@/components/marketing/marketing-footer";

/**
 * The public shell. The nav is fixed rather than sticky so the hero can run
 * underneath it, which is why every section below carries its own scroll
 * margin for anchor links.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-ink min-h-dvh">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
