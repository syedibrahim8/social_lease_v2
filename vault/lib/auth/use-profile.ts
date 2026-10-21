"use client";

import { useQuery } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";
import {
  getMyBrandProfile,
  getMyCreatorProfile,
  type BrandProfile,
  type CreatorProfile,
} from "@/lib/api/endpoints/profiles";
import { useAuth } from "@/lib/auth/auth-provider";
import { qk } from "@/lib/query";

/**
 * The signed-in user's creator or brand profile.
 *
 * `missing` is the one state that matters most: the backend answers 404 until
 * onboarding creates the profile, and until then a creator can't apply and a
 * brand can't post. Admins have no profile and are never `missing`.
 *
 * Shares query keys with the settings screen, so both read one cache entry.
 */
export function useMyProfile() {
  const { role } = useAuth();
  const isCreator = role === "CREATOR";
  const isBrand = role === "BRAND";

  const creator = useQuery({
    queryKey: qk.creatorProfile(),
    queryFn: getMyCreatorProfile,
    enabled: isCreator,
    retry: false,
  });
  const brand = useQuery({
    queryKey: qk.brandProfile(),
    queryFn: getMyBrandProfile,
    enabled: isBrand,
    retry: false,
  });

  const query = isCreator ? creator : brand;
  const applies = isCreator || isBrand;
  const missing = applies && query.error instanceof ApiError && query.error.status === 404;

  return {
    applies,
    isCreator,
    missing,
    isPending: applies && query.isPending,
    creatorProfile: isCreator ? (creator.data as CreatorProfile | undefined) : undefined,
    brandProfile: isBrand ? (brand.data as BrandProfile | undefined) : undefined,
  };
}
