# L1 — App Shell & Navigation Implementation Plan

> Builds the authenticated shell + role-aware navigation. Gates: typecheck +
> lint + build, plus a navigable shell for Creator / Brand / Admin, responsive
> and dark-mode correct.

**Goal:** A polished, navigable app shell — collapsible role-aware sidebar, top
nav (global ⌘K search, notification center, account menu w/ role switcher, theme
toggle), reusable page header, and a responsive mobile drawer — with stub pages
for every destination so all three personas can move through the product.

**Architecture:** `app/(app)/layout.tsx` renders `<AppShell>` (sidebar + top nav +
content container). Navigation is data-driven from `lib/config/nav.ts` keyed by
role; the active item comes from `usePathname()`. Sidebar collapse + ⌘K open live
in the existing `ui-store` (zustand). The mock `AuthProvider` role switcher drives
which nav set renders. Mock notifications seed the bell.

## Tasks

### Task 1: Nav config — `lib/config/nav.ts`

Role-keyed sections of `{ label, href, icon }`. Creator / Brand / Admin primary
nav + a shared secondary section (Notifications, Settings). Typed with lucide icons.

### Task 2: PageHeader — `components/layout/page-header.tsx`

`{ title, description?, actions? }` — consistent page top used by every route.

### Task 3: Sidebar — `components/layout/sidebar.tsx`

Brand mark, grouped nav (active state, emerald accent), collapse toggle (ui-store,
tooltips when collapsed), user mini-footer. Uses `useAuth().role`.

### Task 4: CommandMenu — `components/layout/command-menu.tsx`

Global ⌘K (CommandDialog) wired to `ui-store.commandOpen` + a keydown listener in
AppShell; lists the current role's nav + quick actions; `router.push` on select.

### Task 5: NotificationCenter — `components/layout/notification-center.tsx`

Bell with unread dot + popover list (mock notifications), mark-all-read, link to
`/notifications`.

### Task 6: AccountMenu — `components/layout/account-menu.tsx`

Avatar dropdown: name/email, **role switcher** (CREATOR/BRAND/ADMIN via setRole),
Settings link, mock Sign out.

### Task 7: TopNav + MobileSidebar — `components/layout/top-nav.tsx`, `mobile-sidebar.tsx`

Top bar: mobile menu trigger, ⌘K search button, NotificationCenter, ThemeToggle,
AccountMenu. Mobile drawer = Sheet wrapping the nav for `<lg`.

### Task 8: AppShell + layout — `components/layout/app-shell.tsx`, `app/(app)/layout.tsx`

Compose sidebar (desktop) + top nav + `<main>` container; mount CommandMenu; ⌘K
listener. `(app)` route group inherits root providers.

### Task 9: Stub pages

A small `RoutePlaceholder` (PageHeader + EmptyState noting the owning layer) for:
dashboard, marketplace, campaigns/mine, assets, assets/mine, negotiations, wallet,
analytics, verifications, notifications, settings, admin, admin/verifications.

### Task 10: Mock notifications seed — extend `lib/api/mock`

A few realistic notifications for the bell.

### Task 11: Verify

`pnpm typecheck && pnpm lint && pnpm build`; navigate the shell for all 3 roles;
check responsive drawer + dark mode.
