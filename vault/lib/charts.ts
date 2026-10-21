import type { BarDatum } from "@/components/charts/bar-list";

/** A `{ STATUS: count }` record as labelled bars, using a label map. */
export function toBars(
  record: Record<string, number> | undefined,
  label: (key: string) => string,
): BarDatum[] {
  return Object.entries(record ?? {}).map(([key, value]) => ({ label: label(key), value }));
}
