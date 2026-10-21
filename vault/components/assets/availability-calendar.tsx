"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import {
  addAvailabilityBlock,
  removeAvailabilityBlock,
  type AvailabilityBlock,
} from "@/lib/api/endpoints/assets";
import { invalidateFor, qk } from "@/lib/query";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function blockFor(day: Date, blocks: AvailabilityBlock[]): AvailabilityBlock | undefined {
  return blocks.find((b) =>
    isWithinInterval(day, {
      start: startOfDay(parseISO(b.startDate)),
      end: startOfDay(parseISO(b.endDate)),
    }),
  );
}

function Month({ month, blocks }: { month: Date; blocks: AvailabilityBlock[] }) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(month), { weekStartsOn: 1 }),
  });
  return (
    <div>
      <p className="text-bone mb-2 text-[13px] font-medium">{format(month, "MMMM yyyy")}</p>
      <div className="grid grid-cols-7 gap-1" role="grid" aria-label={format(month, "MMMM yyyy")}>
        {WEEKDAYS.map((d, i) => (
          <span key={i} className="text-muted text-center text-[10px]" aria-hidden="true">
            {d}
          </span>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, month);
          const block = inMonth ? blockFor(day, blocks) : undefined;
          return (
            <span
              key={day.toISOString()}
              role="gridcell"
              aria-label={`${format(day, "d MMMM")}${block ? `, booked${block.note ? `: ${block.note}` : ""}` : ", free"}`}
              title={block?.note}
              className={cn(
                "tnum grid aspect-square place-items-center rounded-md text-[11px]",
                !inMonth && "text-transparent",
                inMonth && !block && "text-bone-2",
                block && "bg-gold/18 text-gold-hi",
                isToday(day) && inMonth && "ring-bone/30 ring-1",
              )}
            >
              {format(day, "d")}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/**
 * The listing's booked windows. Read-only for brands; the owner can add and
 * remove blocks. The backend refuses overlapping blocks (409), and that answer
 * is shown next to the dates rather than as a toast.
 */
export function AvailabilityCalendar({
  assetId,
  blocks,
  editable,
}: {
  assetId: string;
  blocks: AvailabilityBlock[];
  editable: boolean;
}) {
  const queryClient = useQueryClient();
  const [offset, setOffset] = useState(0);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const first = addMonths(startOfMonth(new Date()), offset);
  const sorted = [...blocks].sort((a, b) => a.startDate.localeCompare(b.startDate));

  const refresh = () => invalidateFor(queryClient, "asset", [qk.asset(assetId), qk.availability(assetId)]);

  const add = useMutation({
    mutationFn: () =>
      addAvailabilityBlock(assetId, {
        startDate: start,
        endDate: end,
        ...(note.trim() ? { note: note.trim() } : {}),
      }),
    onSuccess: () => {
      refresh();
      setStart("");
      setEnd("");
      setNote("");
      setError(null);
      toast.success("Dates blocked.");
    },
    onError: (e) => {
      if (e instanceof ApiError && (e.status === 409 || e.status === 422 || e.status === 400)) {
        setError(e.fieldError("endDate") ?? e.message);
        return;
      }
      toast.error(e instanceof ApiError ? e.message : "Could not block those dates.");
    },
  });

  const remove = useMutation({
    mutationFn: (blockId: string) => removeAvailabilityBlock(assetId, blockId),
    onSuccess: () => {
      refresh();
      toast.success("Dates freed.");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not remove the block."),
  });

  const canAdd = start !== "" && end !== "" && end >= start;

  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-bone text-[13px] font-medium">Calendar</p>
            <p className="text-muted mt-0.5 text-[12px]">Gold days are already booked.</p>
          </div>
          <div className="flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              aria-label="Previous months"
              disabled={offset <= 0}
              onClick={() => setOffset((o) => o - 2)}
            >
              <ChevronLeft aria-hidden="true" />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Next months" onClick={() => setOffset((o) => o + 2)}>
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Month month={first} blocks={blocks} />
          <Month month={addMonths(first, 1)} blocks={blocks} />
        </div>

        {sorted.length > 0 ? (
          <ul className="divide-line-2 divide-y">
            {sorted.map((b) => (
              <li key={b._id} className="flex items-center justify-between gap-3 py-2">
                <div className="min-w-0">
                  <p className="tnum text-bone-2 text-[13px]">
                    {format(parseISO(b.startDate), "d MMM yyyy")} – {format(parseISO(b.endDate), "d MMM yyyy")}
                  </p>
                  {b.note ? <p className="text-muted truncate text-[11px]">{b.note}</p> : null}
                </div>
                {editable ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Free ${format(parseISO(b.startDate), "d MMM")} to ${format(parseISO(b.endDate), "d MMM")}`}
                    loading={remove.isPending && remove.variables === b._id}
                    onClick={() => remove.mutate(b._id)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted text-[12px]">No dates booked.</p>
        )}

        {editable ? (
          <div className="border-line-2 space-y-3 border-t pt-4">
            <p className="text-bone-2 text-xs font-medium">Block dates</p>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_2fr_auto] sm:items-end">
              <Field label="From" htmlFor="block-start">
                <Input id="block-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
              </Field>
              <Field label="To" htmlFor="block-end">
                <Input
                  id="block-end"
                  type="date"
                  value={end}
                  min={start || undefined}
                  onChange={(e) => setEnd(e.target.value)}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? "block-error" : undefined}
                />
              </Field>
              <Field label="Note" htmlFor="block-note">
                <Input
                  id="block-note"
                  value={note}
                  maxLength={280}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Booked for another brand"
                />
              </Field>
              <Button size="md" disabled={!canAdd} loading={add.isPending} onClick={() => add.mutate()}>
                Block
              </Button>
            </div>
            {error ? (
              <p id="block-error" role="alert" className="text-negative text-[12px]">
                {error}
              </p>
            ) : null}
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}
