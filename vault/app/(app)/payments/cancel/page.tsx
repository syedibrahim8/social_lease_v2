"use client";

import { use } from "react";
import Link from "next/link";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Where Stripe sends the brand if they back out of the hosted checkout.
 *
 * Nothing went wrong here, so nothing is styled as though it did. No red, no
 * warning icon, no "payment failed" — the person simply changed their mind, and
 * the screen's only job is to say clearly that they were not charged and to put
 * them back where they were.
 */
export default function PaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ contractId?: string }>;
}) {
  const { contractId } = use(searchParams);

  return (
    <div className="mx-auto max-w-md py-12 text-center">
      <span className="bg-bone/6 text-muted mx-auto grid size-12 place-items-center rounded-2xl">
        <Undo2 className="size-5" aria-hidden="true" />
      </span>
      <h1 className="font-display text-bone mt-4 text-2xl">Payment not completed</h1>
      <p className="text-muted mt-2 text-[13px] leading-relaxed">
        You were not charged and escrow is still unfunded. The contract is exactly as you
        left it, and you can fund it whenever you are ready.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button asChild variant="gold" size="sm">
          <Link href={contractId ? `/contracts/${contractId}` : "/contracts"}>
            Back to the contract
          </Link>
        </Button>
      </div>
    </div>
  );
}
