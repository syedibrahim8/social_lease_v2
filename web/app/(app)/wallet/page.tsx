"use client";

import { useAuth } from "@/lib/auth/auth-provider";
import { CreatorWalletView } from "@/components/wallet/creator-wallet";
import { BrandWalletView } from "@/components/wallet/brand-wallet";

export default function WalletPage() {
  const { role } = useAuth();
  return role === "BRAND" ? <BrandWalletView /> : <CreatorWalletView />;
}
