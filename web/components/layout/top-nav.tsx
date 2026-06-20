"use client";

import { Search } from "lucide-react";
import { useUiStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { NotificationCenter } from "./notification-center";
import { AccountMenu } from "./account-menu";
import { MobileSidebar } from "./mobile-sidebar";

export function TopNav() {
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);

  return (
    <header className="bg-background/80 border-border sticky top-0 z-20 flex h-14 items-center gap-2 border-b px-4 backdrop-blur sm:px-6">
      <MobileSidebar />

      {/* Faux search input (md+) that opens the command palette */}
      <button
        onClick={() => setCommandOpen(true)}
        className="text-muted-foreground border-border bg-muted/40 hover:bg-muted hidden h-8 w-full max-w-xs items-center gap-2 rounded-lg border px-2.5 text-sm transition-colors md:flex"
      >
        <Search className="size-3.5" />
        <span>Search or jump to…</span>
        <kbd className="bg-background text-muted-foreground tabular ml-auto rounded border-border border px-1 text-[10px]">
          ⌘K
        </kbd>
      </button>

      {/* Compact search on small screens */}
      <Button
        variant="outline"
        size="icon"
        className="md:hidden"
        onClick={() => setCommandOpen(true)}
        aria-label="Search"
      >
        <Search />
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <NotificationCenter />
        <ThemeToggle />
        <AccountMenu />
      </div>
    </header>
  );
}
