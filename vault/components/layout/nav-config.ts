import {
  BadgeCheck,
  Bell,
  Compass,
  FileText,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  MessagesSquare,
  Settings,
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
 * ADMIN is out of scope for this slice and deliberately has no nav — the shell
 * says so plainly rather than rendering an empty sidebar.
 */
export const NAV_BY_ROLE: Record<Role, NavSection[]> = {
  CREATOR: [
    {
      label: "Workspace",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Find campaigns", href: "/marketplace", icon: Compass },
        { label: "Negotiations", href: "/negotiations", icon: MessagesSquare },
        { label: "Contracts", href: "/contracts", icon: FileText },
        { label: "Wallet", href: "/wallet", icon: Wallet },
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
      ],
    },
    account,
  ],
  ADMIN: [
    {
      label: "Account",
      items: [
        { label: "Verification", href: "/verifications", icon: BadgeCheck },
        { label: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ],
};

export function navFor(role: Role): NavSection[] {
  return NAV_BY_ROLE[role];
}

/** Active when the path equals the href or sits beneath it. */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}
