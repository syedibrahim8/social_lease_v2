"use client";

import { useEffect, useState } from "react";

/**
 * One ratio against its whole (conversion, approval, completion). The figure is
 * the headline; the track only shows how much of the whole it is, so it carries
 * no colour meaning beyond the accent. Exposed to assistive tech as a meter.
 */
export function Meter({
  label,
  value,
  detail,
}: {
  label: string;
  /** 0–1 */
  value: number;
  detail?: string;
}) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-bone-2 text-[12px]">{label}</p>
        <p className="font-display text-bone text-2xl tabular-nums">{pct}%</p>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-valuetext={`${pct}%${detail ? `, ${detail}` : ""}`}
        className="bg-bone/6 mt-2 h-2 overflow-hidden rounded-full"
      >
        <span
          className="bg-gold block h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out-sl)] motion-reduce:transition-none"
          style={{ width: grown ? `${pct}%` : "0%" }}
        />
      </div>
      {detail ? <p className="text-muted mt-1.5 text-[11px]">{detail}</p> : null}
    </div>
  );
}
