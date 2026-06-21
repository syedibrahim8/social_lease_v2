import type { CSSProperties } from "react";

/** Shared Recharts theming — colors from the design tokens, themed tooltip. */
export const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
] as const;

export const chartTooltip: {
  contentStyle: CSSProperties;
  labelStyle: CSSProperties;
} = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    fontSize: 12,
    boxShadow: "var(--shadow-md)",
  },
  labelStyle: { color: "var(--color-muted-foreground)" },
};
