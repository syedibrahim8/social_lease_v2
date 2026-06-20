"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useUiStore } from "@/lib/store/ui-store";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Logo } from "./logo";
import { SidebarNav } from "./sidebar-nav";
import { cn } from "@/lib/utils";

/** Desktop sidebar (lg+). Collapses to an icon rail; mobile uses MobileSidebar. */
export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "bg-sidebar border-sidebar-border sticky top-0 hidden h-svh shrink-0 flex-col border-r transition-[width] duration-200 lg:flex",
        collapsed ? "w-16" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center px-4",
          collapsed && "justify-center px-0",
        )}
      >
        <Logo collapsed={collapsed} />
      </div>

      <ScrollArea className="flex-1 py-4">
        <SidebarNav collapsed={collapsed} />
      </ScrollArea>

      <div
        className={cn(
          "border-sidebar-border border-t p-3",
          collapsed && "flex justify-center",
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
    </aside>
  );
}
