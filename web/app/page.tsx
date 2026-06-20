import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="bg-brand mb-6 flex size-11 items-center justify-center rounded-xl shadow-sm">
        <LayoutGrid className="text-brand-foreground size-5" />
      </div>
      <Badge variant="secondary">Layer 0 · Foundation & Design System</Badge>
      <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-balance">
        Creator Asset Marketplace
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm text-balance">
        The marketplace where brands and creators run campaigns, negotiate,
        deliver proof of work, and get paid through secure escrow. The design
        system foundation is ready.
      </p>
      <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
        <Button asChild variant="brand" size="lg">
          <Link href="/register">
            Get started
            <ArrowRight />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
      <Link
        href="/style"
        className="text-muted-foreground hover:text-foreground mt-6 text-xs"
      >
        View the design system →
      </Link>
    </main>
  );
}
