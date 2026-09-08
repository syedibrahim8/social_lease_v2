"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Settings, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth/auth-provider";

const ROLE_LABEL: Record<string, string> = {
  CREATOR: "Creator",
  BRAND: "Brand",
  ADMIN: "Admin",
};

export function AccountMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0] ?? "")
    .join("")
    .toUpperCase();

  const onSignOut = async () => {
    await logout();
    // Drop every cached response: the next person to sign in on this browser
    // must not see the previous person's balances for even one frame.
    queryClient.clear();
    router.replace("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="hover:bg-bone/5 flex items-center gap-2 rounded-lg py-1 pr-2 pl-1 transition-colors"
      >
        <span className="bg-emerald-deep text-gold-lo border-line grid size-7 place-items-center rounded-full border text-[11px] font-semibold">
          {initials}
        </span>
        <span className="text-bone-2 hidden text-[13px] sm:inline">{user.name}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p className="text-bone truncate text-[13px] font-medium">{user.name}</p>
          <p className="text-muted truncate text-[11px]">{user.email}</p>
          <div className="mt-2 flex items-center gap-1.5">
            <Badge tone="gold">{ROLE_LABEL[user.role] ?? user.role}</Badge>
            {user.isVerified ? (
              <Badge tone="positive">
                <ShieldCheck aria-hidden="true" />
                Verified
              </Badge>
            ) : (
              <Badge tone="warning">Unverified</Badge>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/settings">
            <Settings aria-hidden="true" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sign out sits below a separator, away from navigation items, so it
            is never the thing you hit while aiming for Settings. */}
        <DropdownMenuItem
          onSelect={() => void onSignOut()}
          className="text-negative data-[highlighted]:text-negative data-[highlighted]:bg-negative/10"
        >
          <LogOut aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
