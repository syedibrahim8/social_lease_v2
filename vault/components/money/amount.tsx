import { formatMoney, splitMoney } from "@/lib/money";
import { cn } from "@/lib/utils";

/**
 * The two number voices of the design system, in one component.
 *
 *   display — Playfair, decimals in gold. The amount you FEEL: a balance, a
 *             contract value, a payout confirmation. One per view.
 *   figure  — JetBrains Mono, tabular. The amount you COMPARE: every ledger
 *             row, stat and badge. Tabular so columns never shift as digits
 *             change.
 *
 * `minor` is integer minor units, always. Passing dollars here produces an
 * amount 100× too small, which is exactly the kind of bug that should be
 * impossible to introduce quietly — hence the name.
 */
export function Amount({
  minor,
  currency = "USD",
  variant = "figure",
  signed = false,
  className,
}: {
  minor: number;
  currency?: string;
  variant?: "display" | "figure";
  /** Show an explicit +/− and colour by direction. For ledger rows. */
  signed?: boolean;
  className?: string;
}) {
  if (variant === "display") {
    const { symbol, whole, fraction, negative } = splitMoney(minor, currency);
    return (
      <span className={cn("font-display tracking-tight tabular-nums", className)}>
        {negative ? "−" : ""}
        {symbol}
        {whole}
        <span className="text-gold">.{fraction}</span>
      </span>
    );
  }

  const formatted = formatMoney(Math.abs(minor), currency);
  const sign = minor < 0 ? "−" : "+";

  return (
    <span
      className={cn(
        "tnum",
        signed && (minor < 0 ? "text-negative" : "text-positive"),
        className,
      )}
    >
      {signed ? sign : minor < 0 ? "−" : ""}
      {formatted}
    </span>
  );
}
