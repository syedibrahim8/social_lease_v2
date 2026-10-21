import {
  Bell,
  ChartColumn,
  Compass,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  type LucideIcon,
  Megaphone,
  MessagesSquare,
  Settings,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { Role } from "@/lib/api/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

const account: NavSection = {
  label: "Account",
  items: [
    { label: "Verification", href: "/verifications", icon: ShieldCheck },
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
};

const adminAccount: NavSection = {
  label: "Account",
  items: [
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
};

/**
 * Navigation per persona.
 *
 * The two roles genuinely do different jobs, so they get different words for
 * the same screens: a creator goes to "Find campaigns", a brand goes to "Find
 * creators". Both land on a marketplace; naming it neutrally would make each
 * of them work out which side they are on.
 *
 * ADMIN gets the platform tools: the review queue (and, with the analytics
 * screens, the platform overview).
 */
export const NAV_BY_ROLE: Record<Role, NavSection[]> = {
  CREATOR: [
    {
      label: "Workspace",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Find campaigns", href: "/marketplace", icon: Compass },
        { label: "My listings", href: "/listings", icon: LayoutGrid },
        { label: "Negotiations", href: "/negotiations", icon: MessagesSquare },
        { label: "Contracts", href: "/contracts", icon: FileText },
        { label: "Wallet", href: "/wallet", icon: Wallet },
        { label: "Analytics", href: "/analytics", icon: ChartColumn },
      ],
    },
    account,
  ],
  BRAND: [
    {
      label: "Workspace",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "My campaigns", href: "/campaigns/mine", icon: Megaphone },
        { label: "Find creators", href: "/assets", icon: Users },
        { label: "Negotiations", href: "/negotiations", icon: MessagesSquare },
        { label: "Contracts", href: "/contracts", icon: FileText },
        { label: "Wallet", href: "/wallet", icon: Wallet },
        { label: "Analytics", href: "/analytics", icon: ChartColumn },
      ],
    },
    account,
  ],
  ADMIN: [
    {
      label: "Admin",
      items: [
        { label: "Overview", href: "/admin", icon: LayoutDashboard },
        { label: "Verification queue", href: "/admin/verifications", icon: ShieldCheck },
      ],
    },
    adminAccount,
  ],
};

export function navFor(role: Role): NavSection[] {
  return NAV_BY_ROLE[role];
}

/** Active when the path equals the href or sits beneath it. */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
