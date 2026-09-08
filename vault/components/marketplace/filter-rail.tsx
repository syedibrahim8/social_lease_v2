"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
}

/**
 * Filters live in the URL, not in component state.
 *
 * That makes a filtered view shareable, survivable across a refresh, and
 * navigable with the back button — all of which people expect from a search
 * result and none of which local state gives you.
 *
 * Below `lg` the groups collapse behind a toggle. Stacked open, twenty-odd
 * pills sit between the search box and the first result, so the whole point of
 * the screen is pushed off a phone viewport. Search stays visible because it is
 * the one control people reach for immediately.
 */
export function FilterRail({
  groups,
  searchPlaceholder = "Search",
}: {
  groups: FilterGroup[];
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [openOnMobile, setOpenOnMobile] = useState(false);

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      if (value === null || value === "") next.delete(key);
      else next.set(key, value);
      // Any filter change resets paging: page 4 of the old result set is
      // meaningless against the new one.
      next.delete("page");
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  const activeCount = groups.reduce((n, g) => n + (params.get(g.key) ? 1 : 0), 0);
  const search = params.get("search") ?? "";

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search
          className="text-faint pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          aria-label={searchPlaceholder}
          placeholder={searchPlaceholder}
          defaultValue={search}
          className="pl-8.5"
          onKeyDown={(e) => {
            if (e.key === "Enter") setParam("search", e.currentTarget.value.trim());
          }}
          onBlur={(e) => {
            if (e.currentTarget.value.trim() !== search) {
              setParam("search", e.currentTarget.value.trim());
            }
          }}
        />
      </div>

      {/* Mobile-only toggle. Hidden from desktop, where the rail is always open. */}
      <button
        type="button"
        onClick={() => setOpenOnMobile((v) => !v)}
        aria-expanded={openOnMobile}
        className={cn(
          "border-line-2 text-bone-2 hover:border-bone/20 flex h-10 items-center gap-2 rounded-lg border px-3 text-[13px]",
          "transition-colors lg:hidden",
        )}
      >
        <SlidersHorizontal className="size-3.5" aria-hidden="true" />
        Filters
        {activeCount > 0 ? (
          <span className="bg-gold/15 text-gold-lo tnum ml-auto rounded-full px-2 py-0.5 text-[10px]">
            {activeCount}
          </span>
        ) : null}
      </button>

      <div className={cn("flex-col gap-5", openOnMobile ? "flex" : "hidden lg:flex")}>
        {groups.map((group) => {
          const current = params.get(group.key);
          return (
            <div key={group.key}>
              <p className="text-muted mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.options.map((opt) => {
                  const active = current === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setParam(group.key, active ? null : opt.value)}
                      className={cn(
                        // min-h-9 keeps these comfortably tappable on a phone;
                        // at their natural text height they were 27px, which
                        // clears the WCAG minimum but is not pleasant to hit.
                        "inline-flex min-h-9 items-center rounded-full border px-3 text-[11px] transition-colors",
                        active
                          ? "border-gold/40 bg-gold/12 text-gold-lo"
                          : "border-line-2 text-muted hover:border-bone/20 hover:text-bone",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {activeCount > 0 || search ? (
          <Button
            variant="quiet"
            size="sm"
            className="h-9"
            onClick={() => router.replace(pathname, { scroll: false })}
          >
            <X />
            Clear filters
          </Button>
        ) : null}
      </div>
    </div>
  );
}
