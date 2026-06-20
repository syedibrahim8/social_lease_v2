import {
  BadgeCheck,
  BarChart3,
  Bell,
  Compass,
  LayoutDashboard,
  type LucideIcon,
  Megaphone,
  MessagesSquare,
  Package,
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
  label?: string;
  items: NavItem[];
}

const account: NavSection = {
  label: "Account",
  items: [
    { label: "Notifications", href: "/notifications", icon: Bell },
    { label: "Settings", href: "/settings", icon: Settings },
  ],
};

/** Primary navigation per persona. The shared `account` section is appended to each. */
export const navByRole: Record<Role, NavSection[]> = {
  CREATOR: [
    {
      label: "Workspace",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { label: "Find campaigns", href: "/marketplace", icon: Compass },
        { label: "Negotiations", href: "/negotiations", icon: MessagesSquare },
        { label: "My assets", href: "/assets/mine", icon: Package },
        { label: "Wallet", href: "/wallet", icon: Wallet },
        { label: "Analytics", href: "/analytics", icon: BarChart3 },
        { label: "Verification", href: "/verifications", icon: BadgeCheck },
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
        { label: "Wallet", href: "/wallet", icon: Wallet },
        { label: "Analytics", href: "/analytics", icon: BarChart3 },
        { label: "Verification", href: "/verifications", icon: BadgeCheck },
      ],
    },
    account,
  ],
  ADMIN: [
    {
      label: "Admin",
      items: [
        { label: "Overview", href: "/admin", icon: LayoutDashboard },
        {
          label: "Verifications",
          href: "/admin/verifications",
          icon: ShieldCheck,
        },
        { label: "Analytics", href: "/analytics", icon: BarChart3 },
      ],
    },
    account,
  ],
};

/** Active when the path equals the href or is nested beneath it. */
export function isNavActive(pathname: string, href: string): boolean {
  if (href === "/dashboard" || href === "/admin") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Flattened items for the current role — used by the ⌘K command menu. */
export function navItemsFor(role: Role): NavItem[] {
  return navByRole[role].flatMap((section) => section.items);
}
