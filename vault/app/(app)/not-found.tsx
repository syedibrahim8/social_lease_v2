import Link from "next/link";
import { Construction } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/feedback/empty-state";

/**
 * Several nav destinations land here until their screens are built. Saying so
 * plainly beats a bare 404, which reads as "the app is broken" rather than
 * "this part isn't finished yet".
 */
export default function AppNotFound() {
  return (
    <EmptyState
      icon={Construction}
      title="This screen isn't built yet"
      description="Vault is being assembled one flow at a time. This destination is in the plan but has not landed on this branch."
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">Back to dashboard</Link>
        </Button>
      }
    />
  );
}
