"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
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
    <div className="flex flex-col gap-5">
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

      {groups.map((group) => {
        const current = params.get(group.key);
        return (
          <div key={group.key}>
            <p className="text-faint mb-2 text-[10px] font-semibold tracking-[0.14em] uppercase">
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
                      "rounded-full border px-2.5 py-1 text-[11px] transition-colors",
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
          onClick={() => router.replace(pathname, { scroll: false })}
        >
          <X />
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
