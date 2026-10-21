"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Trash2 } from "lucide-react";
import { BackLink } from "@/components/layout/back-link";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyState } from "@/components/feedback/empty-state";
import { QueryBoundary } from "@/components/feedback/query-boundary";
import { AssetForm } from "@/components/assets/asset-form";
import { AvailabilityCalendar } from "@/components/assets/availability-calendar";
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
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { deleteAsset, getAsset } from "@/lib/api/endpoints/assets";
import { refId } from "@/lib/api/types";
import { useAuth } from "@/lib/auth/auth-provider";
import { invalidateFor, qk } from "@/lib/query";

export default function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState(false);
  const query = useQuery({ queryKey: qk.asset(id), queryFn: () => getAsset(id) });

  const remove = useMutation({
    mutationFn: () => deleteAsset(id),
    onSuccess: () => {
      invalidateFor(queryClient, "asset");
      toast.success("Listing deleted.");
      router.replace("/listings");
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not delete the listing."),
  });

  return (
    <>
      <BackLink href="/listings">My listings</BackLink>
      <QueryBoundary query={query} skeleton={<Skeleton className="h-96 w-full" />}>
        {(asset) =>
          refId(asset.creatorId) !== user?.id ? (
            <EmptyState
              icon={Lock}
              title="This isn't your listing"
              description="Only the creator who listed it can edit it."
            />
          ) : (
            <>
              <PageHeader
                title={asset.title}
                action={
                  <Button variant="ghost" size="sm" onClick={() => setConfirm(true)}>
                    <Trash2 aria-hidden="true" />
                    Delete
                  </Button>
                }
              />
              <div className="mb-5 flex flex-wrap gap-1.5">
                <Badge tone={asset.verificationStatus === "VERIFIED" ? "positive" : "muted"}>
                  {asset.verificationStatus === "VERIFIED" ? "Verified" : "Not verified yet"}
                </Badge>
              </div>
              <div className="space-y-6">
                <AvailabilityCalendar assetId={asset.id} blocks={asset.availability.blocks ?? []} editable />
                <AssetForm key={asset.id} asset={asset} />
              </div>

              <Dialog open={confirm} onOpenChange={setConfirm}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete this listing?</DialogTitle>
                    <DialogDescription>
                      Brands will no longer see it. Contracts already agreed are not affected.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>
                      Keep it
                    </Button>
                    <Button variant="danger" size="sm" loading={remove.isPending} onClick={() => remove.mutate()}>
                      Delete listing
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </>
          )
        }
      </QueryBoundary>
    </>
  );
}
