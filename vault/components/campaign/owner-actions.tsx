"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ApiError } from "@/lib/api/client";
import { deleteCampaign, publishCampaign } from "@/lib/api/endpoints/campaigns";
import {
  DELETABLE_CAMPAIGN_STATUSES,
  EDITABLE_CAMPAIGN_STATUSES,
  type Campaign,
} from "@/lib/api/types";
import { invalidateFor, qk } from "@/lib/query";

/**
 * What the owning brand can do to its campaign, offered only in the states the
 * backend allows, so a button never leads to a 409.
 */
export function OwnerActions({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const publish = useMutation({
    mutationFn: () => publishCampaign(campaign.id),
    onSuccess: () => {
      invalidateFor(queryClient, "campaign", [qk.campaign(campaign.id)]);
      toast.success("Published. Creators can apply now.");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not publish."),
  });

  const remove = useMutation({
    mutationFn: () => deleteCampaign(campaign.id),
    onSuccess: () => {
      invalidateFor(queryClient, "campaign");
      toast.success("Campaign deleted.");
      router.replace("/campaigns/mine");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not delete."),
  });

  const canEdit = EDITABLE_CAMPAIGN_STATUSES.includes(campaign.status);
  const canDelete = DELETABLE_CAMPAIGN_STATUSES.includes(campaign.status);

  return (
    <>
      {canDelete ? (
        <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)}>
          <Trash2 aria-hidden="true" />
          Delete
        </Button>
      ) : null}
      {canEdit ? (
        <Button asChild variant="quiet" size="sm">
          <Link href={`/campaigns/${campaign.id}/edit`}>
            <Pencil aria-hidden="true" />
            Edit
          </Link>
        </Button>
      ) : null}
      {campaign.status === "DRAFT" ? (
        <Button variant="gold" size="sm" loading={publish.isPending} onClick={() => publish.mutate()}>
          Publish
        </Button>
      ) : null}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this campaign?</DialogTitle>
            <DialogDescription>
              {campaign.status === "PUBLISHED"
                ? "It comes off the marketplace and any pending applications close. This can't be undone."
                : "This can't be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
              Keep it
            </Button>
            <Button variant="danger" size="sm" loading={remove.isPending} onClick={() => remove.mutate()}>
              Delete campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
