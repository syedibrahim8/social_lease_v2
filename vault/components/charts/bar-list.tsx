"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/money";

export interface BarDatum {
  label: string;
  value: number;
}

/**
 * Horizontal bars for comparing a handful of counts (status breakdowns, mix by
 * platform). One hue, because the job is magnitude, not identity; every bar is
 * labelled at its tip, so nothing depends on reading colour or a gridline.
 *
 * Bars are thin and rounded only at the data end. They grow in on first paint
 * unless the reader prefers reduced motion. The same numbers sit in a
 * visually-hidden table for screen readers.
 */
export function BarList({
  title,
  data,
  emptyLabel = "Nothing to show yet.",
  sort = true,
}: {
  title: string;
  data: BarDatum[];
  emptyLabel?: string;
  sort?: boolean;
}) {
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rows = (sort ? [...data].sort((a, b) => b.value - a.value) : data).filter((d) => d.value > 0);
  const total = rows.reduce((sum, d) => sum + d.value, 0);
  const max = Math.max(1, ...rows.map((d) => d.value));

  return (
    <figure className="m-0">
      <figcaption className="text-bone mb-3 text-[13px] font-medium">{title}</figcaption>
      {rows.length === 0 ? (
        <p className="text-muted text-[12px]">{emptyLabel}</p>
      ) : (
        <>
          <ul className="space-y-2.5" aria-hidden="true">
            {rows.map((d) => {
              const share = total > 0 ? Math.round((d.value / total) * 100) : 0;
              return (
                <li
                  key={d.label}
                  className="group grid grid-cols-[minmax(6rem,9rem)_1fr_auto] items-center gap-3"
                  title={`${d.label}: ${formatNumber(d.value)} (${share}%)`}
                >
                  <span className="text-bone-2 truncate text-[12px]">{d.label}</span>
                  <span className="bg-bone/6 h-2.5 overflow-hidden rounded-r-[4px]">
                    <span
                      className="bg-gold group-hover:bg-gold-lo block h-full rounded-r-[4px] transition-[width,background-color] duration-700 ease-[var(--ease-out-sl)] motion-reduce:transition-none"
                      style={{ width: grown ? `${(d.value / max) * 100}%` : "0%" }}
                    />
                  </span>
                  <span className="tnum text-bone w-14 text-right text-[12px]">
                    {formatNumber(d.value)}
                    <span className="text-muted ml-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {share}%
                    </span>
                  </span>
                </li>
              );
            })}
          </ul>
          <table className="sr-only">
            <caption>{title}</caption>
            <thead>
              <tr>
                <th scope="col">Category</th>
                <th scope="col">Count</th>
                <th scope="col">Share</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
                <tr key={d.label}>
                  <th scope="row">{d.label}</th>
                  <td>{d.value}</td>
                  <td>{total > 0 ? Math.round((d.value / total) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </figure>
  );
}
