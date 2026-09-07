"use client";

import { useState } from "react";
import { Link2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Field } from "@/components/ui/field";
import { Badge } from "@/components/ui/badge";
import { PROOF_FILE_TYPES, type ProofFile, type ProofLink, type ProofFileType } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const FILE_TYPE_LABEL: Record<ProofFileType, string> = {
  SCREENSHOT: "Screenshot",
  ANALYTICS_SCREENSHOT: "Analytics",
  DOCUMENT: "Document",
};

export interface ProofDraft {
  files: ProofFile[];
  links: ProofLink[];
  note: string;
}

/**
 * Typed proof of delivery.
 *
 * URL-based rather than real uploads: the backend stores a url per file and a
 * Cloudinary slice would replace this input with a picker without changing the
 * shape. Kept honest in the copy so nobody hunts for a missing upload button.
 */
export function ProofForm({
  draft,
  onChange,
  disabled,
}: {
  draft: ProofDraft;
  onChange: (next: ProofDraft) => void;
  disabled?: boolean;
}) {
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState<ProofFileType>("SCREENSHOT");
  const [fileCaption, setFileCaption] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");

  const isUrl = (v: string) => {
    try {
      new URL(v);
      return true;
    } catch {
      return false;
    }
  };

  const addFile = () => {
    if (!isUrl(fileUrl)) return;
    onChange({
      ...draft,
      files: [
        ...draft.files,
        { type: fileType, url: fileUrl.trim(), ...(fileCaption.trim() ? { caption: fileCaption.trim() } : {}) },
      ],
    });
    setFileUrl("");
    setFileCaption("");
  };

  const addLink = () => {
    if (!isUrl(linkUrl)) return;
    onChange({
      ...draft,
      links: [
        ...draft.links,
        { url: linkUrl.trim(), ...(linkLabel.trim() ? { label: linkLabel.trim() } : {}) },
      ],
    });
    setLinkUrl("");
    setLinkLabel("");
  };

  return (
    <div className="space-y-6">
      {/* ── Links ── */}
      <div>
        <p className="text-bone mb-2 text-[13px] font-medium">Live links</p>
        <p className="text-muted mb-3 text-xs leading-relaxed">
          The published post, story or video. This is usually the strongest proof.
        </p>

        {draft.links.length > 0 ? (
          <ul className="mb-3 space-y-2">
            {draft.links.map((l, i) => (
              <li
                key={`${l.url}-${i}`}
                className="border-line-2 flex items-center gap-2.5 rounded-lg border px-3 py-2"
              >
                <Link2 className="text-muted size-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="text-bone-2 block truncate text-xs">{l.label ?? l.url}</span>
                  {l.label ? (
                    <span className="text-faint block truncate text-[11px]">{l.url}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  aria-label="Remove link"
                  disabled={disabled}
                  onClick={() =>
                    onChange({ ...draft, links: draft.links.filter((_, n) => n !== i) })
                  }
                  className="text-muted hover:text-negative grid size-8 shrink-0 place-items-center rounded transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
          <Input
            aria-label="Link URL"
            placeholder="https://instagram.com/p/…"
            value={linkUrl}
            disabled={disabled}
            onChange={(e) => setLinkUrl(e.target.value)}
          />
          <Input
            aria-label="Link label"
            placeholder="Label (optional)"
            value={linkLabel}
            disabled={disabled}
            onChange={(e) => setLinkLabel(e.target.value)}
          />
          <Button
            variant="quiet"
            size="md"
            type="button"
            disabled={disabled ?? !isUrl(linkUrl)}
            onClick={addLink}
          >
            <Plus />
            Add
          </Button>
        </div>
      </div>

      {/* ── Files ── */}
      <div>
        <p className="text-bone mb-2 text-[13px] font-medium">Files</p>
        <p className="text-muted mb-3 text-xs leading-relaxed">
          Screenshots, analytics captures or documents, added by URL. File uploads arrive with
          the media slice.
        </p>

        {draft.files.length > 0 ? (
          <ul className="mb-3 space-y-2">
            {draft.files.map((f, i) => (
              <li
                key={`${f.url}-${i}`}
                className="border-line-2 flex items-center gap-2.5 rounded-lg border px-3 py-2"
              >
                <Badge tone="muted">{FILE_TYPE_LABEL[f.type]}</Badge>
                <span className="min-w-0 flex-1">
                  <span className="text-bone-2 block truncate text-xs">
                    {f.caption ?? f.url}
                  </span>
                  {f.caption ? (
                    <span className="text-faint block truncate text-[11px]">{f.url}</span>
                  ) : null}
                </span>
                <button
                  type="button"
                  aria-label="Remove file"
                  disabled={disabled}
                  onClick={() =>
                    onChange({ ...draft, files: draft.files.filter((_, n) => n !== i) })
                  }
                  className="text-muted hover:text-negative grid size-8 shrink-0 place-items-center rounded transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mb-2 flex flex-wrap gap-1.5">
          {PROOF_FILE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={fileType === t}
              disabled={disabled}
              onClick={() => setFileType(t)}
              className={cn(
                "inline-flex min-h-9 items-center rounded-full border px-3 text-[11px] transition-colors",
                fileType === t
                  ? "border-gold/40 bg-gold/12 text-gold-lo"
                  : "border-line-2 text-muted hover:border-bone/20 hover:text-bone",
              )}
            >
              {FILE_TYPE_LABEL[t]}
            </button>
          ))}
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_150px_auto]">
          <Input
            aria-label="File URL"
            placeholder="https://…"
            value={fileUrl}
            disabled={disabled}
            onChange={(e) => setFileUrl(e.target.value)}
          />
          <Input
            aria-label="File caption"
            placeholder="Caption (optional)"
            value={fileCaption}
            disabled={disabled}
            onChange={(e) => setFileCaption(e.target.value)}
          />
          <Button
            variant="quiet"
            size="md"
            type="button"
            disabled={disabled ?? !isUrl(fileUrl)}
            onClick={addFile}
          >
            <Plus />
            Add
          </Button>
        </div>
      </div>

      <Field label="Note to the brand" htmlFor="proof-note" hint="Optional.">
        <Textarea
          id="proof-note"
          value={draft.note}
          disabled={disabled}
          onChange={(e) => onChange({ ...draft, note: e.target.value })}
          placeholder="Anything they should know about the delivery."
        />
      </Field>
    </div>
  );
}
