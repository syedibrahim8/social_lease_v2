import type { Metadata } from "next";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";

export const metadata: Metadata = { title: "Admin Overview" };

export default function AdminPage() {
  return <AdminDashboard />;
}
