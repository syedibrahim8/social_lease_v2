"use client";

import { useState, type ReactNode } from "react";
import { Menu } from "lucide-react";
import { Logo } from "@/components/layout/logo";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { NotificationBell } from "@/components/layout/notification-bell";
import { AccountMenu } from "@/components/layout/account-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth/auth-provider";
import { useNotificationStream } from "@/lib/notifications/use-notification-stream";

/**
 * The authenticated frame: fixed sidebar on desktop, drawer below `lg`.
 *
 * The live notification stream is opened here, once, for the whole session —
 * not per screen, which would open and tear down a socket on every navigation.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { role } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useNotificationStream();

  if (!role) return null;

  return (
    <div className="min-h-dvh">
      {/* Desktop sidebar */}
      <aside className="border-line-2 bg-ink-2 fixed inset-y-0 left-0 hidden w-56 flex-col border-r px-3 py-4 lg:flex">
        <div className="border-line-2 mb-4 border-b px-2 pb-4">
          <Logo />
        </div>
        <SidebarNav role={role} />
      </aside>

      <div className="lg:pl-56">
        {/* Top bar. Capped at 60px: a bar that eats the viewport is a bar you
            resent on every screen. */}
        <header className="border-line-2 bg-ink/85 sticky top-0 z-30 flex h-15 items-center gap-2 border-b px-4 backdrop-blur-md sm:px-6">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger
              aria-label="Open navigation"
              className="text-muted hover:text-bone hover:bg-bone/5 grid size-9 place-items-center rounded-lg transition-colors lg:hidden"
            >
              <Menu className="size-4" aria-hidden="true" />
            </SheetTrigger>
            <SheetContent title="Navigation">
              <div className="border-line-2 mb-4 border-b px-2 pb-4">
                <Logo />
              </div>
              <SidebarNav role={role} onNavigate={() => setDrawerOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="lg:hidden">
            <Logo />
          </div>

          <div className="ml-auto flex items-center gap-1">
            <NotificationBell />
            <AccountMenu />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
