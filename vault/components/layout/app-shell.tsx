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
import { cn } from "@/lib/utils";

/**
 * The one content container, shared by the header and the page.
 *
 * 1400px rather than max-w-6xl (1152px): this is a dashboard with a fixed
 * sidebar and dense tables, not an article. At 1152 a 1920px monitor left ~270px
 * of dead space on each side and a 2560px one left nearly 600px, with the
 * header stretching past it all. Wide enough to use a large screen, capped so
 * text lines never become unreadably long on an ultrawide.
 */
const CONTAINER = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8";

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
      {/*
        First in the DOM, invisible until focused. Without it a keyboard user
        tabs through the eight sidebar links and both header controls before
        reaching the page, on every single navigation.
      */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:bg-surface focus:border-line focus:text-bone focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:border focus:px-4 focus:py-2 focus:text-[13px] focus:font-medium"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="border-line-2 bg-ink-2 fixed inset-y-0 left-0 hidden w-56 flex-col border-r px-3 py-4 lg:flex">
        <div className="border-line-2 mb-4 border-b px-2 pb-4">
          <Logo />
        </div>
        <SidebarNav role={role} />
      </aside>

      <div className="lg:pl-56">
        {/*
          The header BAR spans the full width so its border and backdrop reach
          the window edge, but its CONTENTS sit in the same centred container as
          the page below. Previously the bar stretched edge to edge while the
          content was capped and centred, so on a wide monitor the account menu
          floated far to the right of everything it belonged to — which reads as
          a broken layout rather than a deliberate one.

          Capped at 60px tall: a bar that eats the viewport is one you resent on
          every screen.
        */}
        <header className="border-line-2 bg-ink/85 sticky top-0 z-30 h-15 border-b backdrop-blur-md">
          <div className={cn(CONTAINER, "flex h-full items-center gap-2")}>
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
          </div>
        </header>

        {/* tabIndex -1 so the skip link can actually move focus here, not just
            scroll the viewport. */}
        <main id="main" tabIndex={-1} className={cn(CONTAINER, "py-6 outline-none sm:py-8")}>
          {children}
        </main>
      </div>
    </div>
  );
}
