import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

interface AuthCardProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Header + body for the auth form column. Shows the logo on mobile (panel is hidden). */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <div>
      <div className="mb-8 lg:hidden">
        <Logo />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? (
        <p className="text-muted-foreground mt-1.5 text-sm">{subtitle}</p>
      ) : null}
      <div className="mt-8">{children}</div>
      {footer ? (
        <div className="text-muted-foreground mt-6 text-center text-sm">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
