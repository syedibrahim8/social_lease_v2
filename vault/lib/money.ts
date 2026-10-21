/**
 * Money formatting.
 *
 * The backend stores every amount as integer minor units (cents) plus a
 * currency code, and this app keeps it that way all the way to the render edge.
 * Nothing upstream of these functions should ever divide by 100 — that is how
 * floating-point cents get into a ledger.
 */

/** `4825000, "USD"` → `"$48,250.00"`. */
export function formatMoney(minor: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/** `4825000` → `"48,250"`. Compact display where the currency is already stated. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export interface MoneyParts {
  symbol: string;
  whole: string;
  fraction: string;
  negative: boolean;
}

/**
 * Split a formatted amount so the display variant can colour the decimals in
 * gold — the small move that makes a balance read as currency rather than as a
 * number that happens to have a dollar sign.
 */
export function splitMoney(minor: number, currency = "USD"): MoneyParts {
  const parts = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).formatToParts(Math.abs(minor) / 100);

  const pick = (type: Intl.NumberFormatPartTypes): string =>
    parts
      .filter((p) => p.type === type)
      .map((p) => p.value)
      .join("");

  return {
    symbol: pick("currency"),
    whole: parts
      .filter((p) => p.type === "integer" || p.type === "group")
      .map((p) => p.value)
      .join(""),
    fraction: pick("fraction"),
    negative: minor < 0,
  };
}

/**
 * The platform fee, as a percentage of the contract value. Mirrors the
 * backend's PLATFORM_COMMISSION_PERCENT default; change both together.
 */
export const PLATFORM_FEE_PERCENT = 2;

/**
 * The platform's cut, mirroring `computeSplit` in the payments service:
 * `commission = round(amount * percent / 100)`, creator gets the remainder.
 *
 * Use this ONLY for a pre-funding estimate. Once a payment record exists, read
 * its stored `commissionAmount` / `creatorAmount` instead — those were frozen
 * at checkout and are what will actually be paid, regardless of what the
 * commission rate is set to today.
 */
export function estimateSplit(
  amount: number,
  commissionPercent = PLATFORM_FEE_PERCENT,
): { commissionAmount: number; creatorAmount: number } {
  const commissionAmount = Math.round((amount * commissionPercent) / 100);
  return { commissionAmount, creatorAmount: amount - commissionAmount };
}

/**
 * Parse an amount typed in whole currency ("1,250.50") into minor units.
 * Returns null for anything that isn't a non-negative amount with at most two
 * decimals — the form says so rather than sending a guess.
 */
export function parseMajorToMinor(input: string): number | null {
  const cleaned = input.replace(/[,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  return Math.round(Number(cleaned) * 100);
}

/** Minor units back into an editable major-unit string ("1250.5" → "1250.50"). */
export function minorToMajorInput(minor: number): string {
  return (minor / 100).toFixed(2).replace(/\.00$/, "");
}
