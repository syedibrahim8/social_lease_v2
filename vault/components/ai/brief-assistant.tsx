"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { ApiError } from "@/lib/api/client";
import { generateBrief, type CampaignBrief } from "@/lib/api/endpoints/ai";
import type { Platform } from "@/lib/api/types";

export interface BriefDraft {
  title: string;
  description: string;
  requirements: string[];
}

/** Fold the structured brief into the three fields the campaign form has. */
function toDraft(brief: CampaignBrief): BriefDraft {
  const section = (heading: string, items: string[]) =>
    items.length > 0 ? `\n\n${heading}\n${items.map((i) => `• ${i}`).join("\n")}` : "";
  const description =
    brief.overview +
    (brief.targetAudience ? `\n\nAudience: ${brief.targetAudience}` : "") +
    section("Objectives", brief.objectives) +
    section("Key messages", brief.keyMessages) +
    section("Do", brief.dos) +
    section("Don't", brief.donts) +
    (brief.hashtags.length > 0 ? `\n\nHashtags: ${brief.hashtags.join(" ")}` : "") +
    (brief.callToAction ? `\n\nCall to action: ${brief.callToAction}` : "");
  return { title: brief.title, description, requirements: brief.deliverables };
}

/**
 * Draft a campaign brief from a product description.
 *
 * The draft is shown before it touches the form, and only replaces the fields
 * when the brand chooses to use it, because it overwrites what they've typed.
 */
export function BriefAssistant({
  platform,
  defaultProduct,
  onUse,
}: {
  platform: Platform | undefined;
  defaultProduct: string;
  onUse: (draft: BriefDraft) => void;
}) {
  const [open, setOpen] = useState(false);
  const [product, setProduct] = useState("");
  const [productName, setProductName] = useState("");
  const [audience, setAudience] = useState("");

  const generate = useMutation({
    mutationFn: () =>
      generateBrief({
        productDescription: product.trim(),
        ...(productName.trim() ? { productName: productName.trim() } : {}),
        ...(audience.trim() ? { targetAudience: audience.trim() } : {}),
        ...(platform ? { platform } : {}),
      }),
    onError: (error) =>
      toast.error(error instanceof ApiError ? error.message : "Could not draft a brief."),
  });

  const brief = generate.data;
  const tooShort = product.trim().length < 10;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next && !product) setProduct(defaultProduct);
      }}
    >
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <Sparkles aria-hidden="true" />
        Draft with AI
      </Button>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Draft a brief</DialogTitle>
          <DialogDescription>
            Describe the product. You&apos;ll see the draft before anything in your form changes.
          </DialogDescription>
        </DialogHeader>

        {brief ? (
          <div className="max-h-[50vh] space-y-3 overflow-y-auto pr-1">
            <div className="flex items-center gap-2">
              <p className="text-bone min-w-0 flex-1 text-[14px] font-medium">{brief.title}</p>
              <Badge tone={brief.generatedBy === "ai" ? "gold" : "muted"}>
                {brief.generatedBy === "ai" ? "AI" : "Template"}
              </Badge>
            </div>
            <p className="text-bone-2 text-[13px] leading-relaxed">{brief.overview}</p>
            {brief.deliverables.length > 0 ? (
              <div>
                <p className="text-muted mb-1 text-[11px]">Becomes your requirements</p>
                <ul className="text-bone-2 list-disc space-y-1 pl-5 text-[13px]">
                  {brief.deliverables.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {brief.generatedBy === "template" ? (
              <p className="text-muted text-[11px] leading-relaxed">
                Built from a template because no AI model is configured. Edit it to fit.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-4">
            <Field
              label="What are you promoting?"
              htmlFor="brief-product"
              required
              hint="At least 10 characters."
            >
              <Textarea
                id="brief-product"
                value={product}
                onChange={(e) => setProduct(e.target.value)}
                maxLength={4000}
                placeholder="A reusable water bottle that keeps drinks cold for 24 hours…"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name" htmlFor="brief-name">
                <Input
                  id="brief-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  maxLength={160}
                />
              </Field>
              <Field label="Audience" htmlFor="brief-audience">
                <Input
                  id="brief-audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  maxLength={400}
                  placeholder="Runners, 25–40"
                />
              </Field>
            </div>
          </div>
        )}

        <DialogFooter>
          {brief ? (
            <>
              <Button type="button" variant="ghost" size="sm" onClick={() => generate.reset()}>
                Start over
              </Button>
              <Button
                type="button"
                variant="gold"
                size="sm"
                onClick={() => {
                  onUse(toDraft(brief));
                  setOpen(false);
                  generate.reset();
                  toast.success("Draft added to your brief. Review it before saving.");
                }}
              >
                Use this draft
              </Button>
            </>
          ) : (
            <Button
              type="button"
              variant="gold"
              size="sm"
              disabled={tooShort}
              loading={generate.isPending}
              onClick={() => generate.mutate()}
            >
              Draft brief
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
