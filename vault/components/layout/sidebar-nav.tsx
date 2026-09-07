"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isNavActive, navFor } from "@/components/layout/nav-config";
import type { Role } from "@/lib/api/types";
import { cn } from "@/lib/utils";

/**
 * The nav list, shared by the fixed desktop sidebar and the mobile drawer so
 * the two can never drift apart.
 *
 * The active item carries a gold inset rule and a gold label. There is
 * deliberately no coloured dot before each item: a dot that is the same colour
 * on every row conveys nothing, and it is one of the clearest tells of a
 * generated dashboard.
 */
export function SidebarNav({
  role,
  onNavigate,
}: {
  role: Role;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary" className="flex flex-col gap-5">
      {navFor(role).map((section) => (
        <div key={section.label}>
          <p className="text-faint px-2.5 pb-2 text-[10px] font-semibold tracking-[0.16em] uppercase">
            {section.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {section.items.map((item) => {
              const active = isNavActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium",
                      "transition-colors duration-[var(--duration-fast)]",
                      active
                        ? "from-gold/15 text-gold-lo shadow-[inset_2px_0_0_var(--color-gold)] bg-gradient-to-r to-transparent"
                        : "text-muted hover:bg-bone/5 hover:text-bone",
                    )}
                  >
                    <Icon className="size-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
