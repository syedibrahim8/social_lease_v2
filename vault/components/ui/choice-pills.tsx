"use client";

import { cn } from "@/lib/utils";

export interface Choice<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

/**
 * A single choice from a short, visible set of options.
 *
 * Pills rather than a dropdown: these choices change what the rest of the form
 * means (which platform, which category), so all of them stay on screen.
 * Built as a radio group so arrow keys move between options and a screen reader
 * announces "1 of 6, selected".
 */
export function ChoicePills<T extends string>({
  options,
  value,
  onChange,
  label,
  id,
  invalid,
  className,
}: {
  options: readonly Choice<T>[];
  value: T | undefined;
  onChange: (value: T) => void;
  /** Accessible name for the group. */
  label: string;
  id?: string;
  invalid?: boolean;
  className?: string;
}) {
  const move = (from: number, step: number) => {
    const enabled = options.filter((o) => !o.disabled);
    const index = enabled.findIndex((o) => o.value === options[from]?.value);
    const next = enabled[(index + step + enabled.length) % enabled.length];
    if (next) {
      onChange(next.value);
      document.getElementById(`${id ?? label}-${next.value}`)?.focus();
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      aria-invalid={invalid || undefined}
      id={id}
      className={cn("flex flex-wrap gap-1.5", className)}
    >
      {options.map((option, i) => {
        const active = option.value === value;
        // Roving tabindex: one tab stop for the group, arrows within it.
        const tabbable = active || (value === undefined && i === 0);
        return (
          <button
            key={option.value}
            id={`${id ?? label}-${option.value}`}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={option.disabled}
            tabIndex={tabbable ? 0 : -1}
            onClick={() => onChange(option.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowDown") {
                e.preventDefault();
                move(i, 1);
              } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
                e.preventDefault();
                move(i, -1);
              }
            }}
            className={cn(
              "inline-flex min-h-9 items-center rounded-full border px-3 text-[11px] transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-40",
              active
                ? "border-gold/40 bg-gold/12 text-gold-lo"
                : "border-line-2 text-muted hover:border-bone/20 hover:text-bone",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
