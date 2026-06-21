import {
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  startOfMonth,
} from "date-fns";
import { cn } from "@/lib/utils";

const weekdays = ["S", "M", "T", "W", "T", "F", "S"];

/** Read-only availability calendar for the current month. */
export function AvailabilityCalendar({ busyDays }: { busyDays: number[] }) {
  const now = new Date();
  const start = startOfMonth(now);
  const days = eachDayOfInterval({ start, end: endOfMonth(now) });
  const leading = getDay(start);
  const busy = new Set(busyDays);

  return (
    <div>
      <p className="mb-3 text-sm font-medium">{format(now, "MMMM yyyy")}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {weekdays.map((d, i) => (
          <span key={i} className="text-muted-foreground py-1 font-medium">
            {d}
          </span>
        ))}
        {Array.from({ length: leading }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const n = day.getDate();
          const isBusy = busy.has(n);
          return (
            <span
              key={n}
              className={cn(
                "tabular flex h-8 items-center justify-center rounded-md",
                isBusy
                  ? "bg-danger-muted text-danger-text line-through"
                  : "bg-muted/50",
              )}
            >
              {n}
            </span>
          );
        })}
      </div>
      <div className="text-muted-foreground mt-3 flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-muted size-2.5 rounded-sm" /> Available
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="bg-danger-muted size-2.5 rounded-sm" /> Booked
        </span>
      </div>
    </div>
  );
}
