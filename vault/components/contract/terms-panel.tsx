import { Card, CardBody } from "@/components/ui/card";
import { Amount } from "@/components/money/amount";
import { estimateSplit } from "@/lib/money";
import type { Contract, Payment } from "@/lib/api/types";

/**
 * What the contract is worth, and what each side actually sees.
 *
 * Once a payment exists its stored commissionAmount/creatorAmount are used —
 * those were frozen at checkout and are what will really be paid, regardless of
 * the platform rate today. Before funding there is no payment yet, so the split
 * is an estimate and is labelled as one rather than quietly implying precision.
 */
export function TermsPanel({
  contract,
  payment,
  commissionPercent = 10,
}: {
  contract: Contract;
  payment?: Payment | null;
  commissionPercent?: number;
}) {
  const estimated = !payment;
  const { commissionAmount, creatorAmount } = payment
    ? { commissionAmount: payment.commissionAmount, creatorAmount: payment.creatorAmount }
    : estimateSplit(contract.agreedPrice, commissionPercent);

  return (
    <Card tone="money">
      <CardBody className="space-y-4">
        <div>
          <p className="text-muted text-[10px] font-semibold tracking-[0.16em] uppercase">
            Contract value
          </p>
          <Amount
            minor={contract.agreedPrice}
            currency={contract.currency}
            variant="display"
            className="mt-2 block text-3xl"
          />
        </div>

        <dl className="border-line space-y-2 border-t pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted text-xs">Platform fee</dt>
            <dd>
              <Amount
                minor={-commissionAmount}
                currency={contract.currency}
                className="text-[13px]"
              />
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-bone-2 text-xs">Creator receives</dt>
            <dd>
              <Amount
                minor={creatorAmount}
                currency={contract.currency}
                className="text-bone text-[13px]"
              />
            </dd>
          </div>
        </dl>

        <p className="text-muted text-[11px] leading-relaxed">
          {estimated
            ? `Estimated at the current ${commissionPercent}% platform fee. The exact split is fixed when escrow is funded.`
            : "Fixed when escrow was funded. This is what will be paid on approval."}
        </p>
      </CardBody>
    </Card>
  );
}
