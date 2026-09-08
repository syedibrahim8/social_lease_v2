import type { ReactNode } from "react";

/**
 * Page title, optional one-line description, optional action.
 *
 * There is no small uppercase label above the title. A category label on every
 * screen is the templated rhythm that makes generated dashboards recognisable,
 * and the sidebar already tells you where you are.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-bone text-2xl leading-tight">{title}</h1>
        {description ? (
          <p className="text-muted mt-1.5 max-w-[62ch] text-[13px] leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}
