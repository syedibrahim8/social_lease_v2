"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, UserRoundPlus } from "lucide-react";
import { useMyProfile } from "@/lib/auth/use-profile";

/**
 * Shown on every screen until the profile exists, because until then the
 * backend refuses the main actions (apply, post a campaign) and the reason
 * would otherwise only surface as an error after the user tried.
 */
export function ProfileBanner() {
  const { missing, isCreator } = useMyProfile();
  const pathname = usePathname();
  if (!missing || pathname.startsWith("/onboarding")) return null;

  return (
    <div className="border-gold/25 bg-gold/8 mb-6 flex flex-wrap items-center gap-3 rounded-xl border px-4 py-3">
      <UserRoundPlus className="text-gold-lo size-4 shrink-0" aria-hidden="true" />
      <p className="text-bone-2 min-w-0 flex-1 text-[13px]">
        {isCreator
          ? "Set up your creator profile before you apply to campaigns."
          : "Set up your company profile before you post a campaign."}
      </p>
      <Link
        href="/onboarding"
        className="text-gold-lo inline-flex min-h-9 items-center gap-1.5 text-[13px] font-medium hover:underline"
      >
        Set up profile
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </Link>
    </div>
  );
}
