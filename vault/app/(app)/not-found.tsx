import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";

/** A plain 404 inside the signed-in shell, with a way back. */
export default function AppNotFound() {
  return (
    <EmptyState
      icon={Compass}
      title="We couldn't find that page"
      description="The link may be out of date, or the item may have been removed."
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
