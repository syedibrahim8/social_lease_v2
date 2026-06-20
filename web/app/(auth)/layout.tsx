import type { ReactNode } from "react";
import { AuthBrandPanel } from "@/components/auth/brand-panel";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
      <AuthBrandPanel />
    </div>
  );
}
