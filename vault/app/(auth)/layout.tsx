import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

/**
 * Split layout: the form on the left where the work happens, the argument for
 * the product on the right. The right panel is hidden below `lg` rather than
 * stacked above the form — nobody signing in on a phone wants to scroll past
 * marketing to reach a password field.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <Logo href="/" />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>

      <aside
        aria-hidden="true"
        className="border-line relative hidden overflow-hidden border-l lg:block"
        style={{
          background:
            "radial-gradient(96% 120% at 78% -10%, #16382E 0%, #0A0F0D 62%)",
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.5]"
          style={{
            backgroundImage:
              "linear-gradient(color-mix(in oklab, #C9A227 5%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklab, #C9A227 5%, transparent) 1px, transparent 1px)",
            backgroundSize: "52px 52px",
            maskImage: "radial-gradient(70% 70% at 50% 30%, #000, transparent)",
          }}
        />
        <div className="relative flex h-full flex-col justify-center px-12">
          <p className="font-display text-bone max-w-[16ch] text-3xl leading-[1.15]">
            The money is already there before the work starts.
          </p>
          <p className="text-bone-2 mt-5 max-w-[42ch] text-sm leading-relaxed">
            Brands fund escrow up front. Creators deliver, brands approve, and the payout
            clears the same day. No invoices, no chasing, no thirty day terms.
          </p>
          <dl className="border-line mt-9 grid grid-cols-3 gap-6 border-t pt-6">
            <div>
              <dt className="text-faint text-[10px] font-semibold tracking-[0.16em] uppercase">
                Held first
              </dt>
              <dd className="tnum text-bone mt-2 text-lg">Escrow</dd>
            </div>
            <div>
              <dt className="text-faint text-[10px] font-semibold tracking-[0.16em] uppercase">
                Platform fee
              </dt>
              <dd className="tnum text-bone mt-2 text-lg">
                10<span className="text-gold">%</span>
              </dd>
            </div>
            <div>
              <dt className="text-faint text-[10px] font-semibold tracking-[0.16em] uppercase">
                Payouts via
              </dt>
              <dd className="tnum text-bone mt-2 text-lg">Stripe</dd>
            </div>
          </dl>
        </div>
      </aside>
    </div>
  );
}
