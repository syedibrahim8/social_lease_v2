import { formatDistanceToNow } from "date-fns";

/**
 * Formatting helpers. Money is ALWAYS handled in integer minor units (cents)
 * to match the backend — never floats. Pair these with the `.tabular` class
 * (Geist Mono + tabular-nums) for aligned figures.
 */

const DEFAULT_LOCALE = "en-US";

/** Minor units (cents) → localized currency string, e.g. 123456 → "$1,234.56". */
export function formatMoney(
  minorUnits: number,
  currency = "USD",
  options?: { compact?: boolean; locale?: string },
): string {
  const { compact = false, locale = DEFAULT_LOCALE } = options ?? {};
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 2,
  }).format(minorUnits / 100);
}

/** Plain number with grouping, e.g. 12345 → "12,345". */
export function formatNumber(value: number, locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale).format(value);
}

/** Compact number, e.g. 12345 → "12.3K", 1200000 → "1.2M". */
export function formatCompact(value: number, locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

/** Fraction (0–1) → percent string, e.g. 0.1234 → "12.3%". */
export function formatPercent(
  fraction: number,
  fractionDigits = 1,
  locale = DEFAULT_LOCALE,
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(fraction);
}

function toDate(input: Date | string | number): Date {
  return input instanceof Date ? input : new Date(input);
}

/** e.g. "Jun 19, 2026". */
export function formatDate(input: Date | string | number, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(toDate(input));
}

/** e.g. "Jun 19, 2026, 3:04 PM". */
export function formatDateTime(input: Date | string | number, locale = DEFAULT_LOCALE): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(toDate(input));
}

/** e.g. "3 hours ago". */
export function formatRelative(input: Date | string | number): string {
  return formatDistanceToNow(toDate(input), { addSuffix: true });
}

/** "Ada Lovelace" → "AL"; falls back to the first character. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}
