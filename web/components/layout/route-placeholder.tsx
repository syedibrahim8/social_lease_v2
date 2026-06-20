import { Hammer } from "lucide-react";
import { PageHeader } from "./page-header";
import { EmptyState } from "@/components/feedback/empty-state";

interface RoutePlaceholderProps {
  title: string;
  description?: string;
  /** The layer that delivers this screen's real UI, e.g. "Layer 4". */
  layer: string;
}

/** Temporary destination so the shell is fully navigable before a screen is built. */
export function RoutePlaceholder({
  title,
  description,
  layer,
}: RoutePlaceholderProps) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} description={description} />
      <div className="border-border bg-card rounded-xl border">
        <EmptyState
          icon={<Hammer />}
          title={`${layer} builds this screen`}
          description="The app shell and navigation are live. This destination's interface arrives in its layer."
        />
      </div>
    </div>
  );
}
