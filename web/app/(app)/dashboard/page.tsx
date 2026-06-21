"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-provider";
import { CreatorDashboard } from "@/components/dashboard/creator-dashboard";
import { BrandDashboard } from "@/components/dashboard/brand-dashboard";

export default function DashboardPage() {
  const { role } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (role === "ADMIN") router.replace("/admin");
  }, [role, router]);

  if (role === "ADMIN") return null;
  if (role === "BRAND") return <BrandDashboard />;
  return <CreatorDashboard />;
}
