/**
 * The social-asset catalogue — ONE list for the whole platform.
 *
 * Campaigns, applications (the per-asset lock), contracts, submissions, asset
 * listings and the AI pricing all speak this vocabulary, so a brand can post a
 * campaign for anything a creator can list, and vice versa. The frontend
 * mirrors it in `vault/lib/api/types.ts`; change both together.
 *
 * `category` and the canonical platform are derived from the type via the maps
 * below and never trusted from a request body.
 */

export const PLATFORMS = [
  'LINKEDIN',
  'INSTAGRAM',
  'YOUTUBE',
  'TWITTER', // shown as "X"
  'FACEBOOK',
  'TIKTOK',
  'THREADS',
  'PINTEREST',
  'SNAPCHAT',
  'TWITCH',
  'OTHER',
] as const;
export type Platform = (typeof PLATFORMS)[number];

export const ASSET_CATEGORIES = ['PROFILE_ASSETS', 'CONTENT_ASSETS', 'UGC_ASSETS'] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export const ASSET_TYPES = [
  // PROFILE_ASSETS — space on the creator's profile, leased for a period.
  'LINKEDIN_BANNER',
  'LINKEDIN_FEATURED_POST',
  'X_HEADER',
  'X_PINNED_POST',
  'INSTAGRAM_BIO_LINK',
  'INSTAGRAM_PINNED_POST',
  'YOUTUBE_CHANNEL_BANNER',
  'TIKTOK_BIO_LINK',
  'TIKTOK_PINNED_VIDEO',
  'FACEBOOK_COVER',
  'THREADS_PINNED_POST',
  'PINTEREST_BOARD',
  'TWITCH_PANEL',
  // CONTENT_ASSETS — a piece of content published on the creator's channel.
  'INSTAGRAM_POST',
  'INSTAGRAM_CAROUSEL',
  'INSTAGRAM_REEL',
  'INSTAGRAM_STORY',
  'YOUTUBE_VIDEO',
  'YOUTUBE_SHORT',
  'YOUTUBE_VLOG',
  'LINKEDIN_POST',
  'X_POST',
  'X_THREAD',
  'TIKTOK_VIDEO',
  'FACEBOOK_POST',
  'FACEBOOK_REEL',
  'FACEBOOK_STORY',
  'THREADS_POST',
  'PINTEREST_PIN',
  'SNAPCHAT_STORY',
  'SNAPCHAT_SPOTLIGHT',
  'TWITCH_STREAM_MENTION',
  // UGC_ASSETS — content made for the brand to use, on any platform.
  'PRODUCT_REVIEW',
  'TESTIMONIAL_VIDEO',
  'PRODUCT_DEMO',
  'UNBOXING_VIDEO',
] as const;
export type AssetType = (typeof ASSET_TYPES)[number];

/** assetType → canonical platform; `null` = platform-flexible (UGC). */
export const ASSET_TYPE_PLATFORM: Record<AssetType, Platform | null> = {
  LINKEDIN_BANNER: 'LINKEDIN',
  LINKEDIN_FEATURED_POST: 'LINKEDIN',
  X_HEADER: 'TWITTER',
  X_PINNED_POST: 'TWITTER',
  INSTAGRAM_BIO_LINK: 'INSTAGRAM',
  INSTAGRAM_PINNED_POST: 'INSTAGRAM',
  YOUTUBE_CHANNEL_BANNER: 'YOUTUBE',
  TIKTOK_BIO_LINK: 'TIKTOK',
  TIKTOK_PINNED_VIDEO: 'TIKTOK',
  FACEBOOK_COVER: 'FACEBOOK',
  THREADS_PINNED_POST: 'THREADS',
  PINTEREST_BOARD: 'PINTEREST',
  TWITCH_PANEL: 'TWITCH',
  INSTAGRAM_POST: 'INSTAGRAM',
  INSTAGRAM_CAROUSEL: 'INSTAGRAM',
  INSTAGRAM_REEL: 'INSTAGRAM',
  INSTAGRAM_STORY: 'INSTAGRAM',
  YOUTUBE_VIDEO: 'YOUTUBE',
  YOUTUBE_SHORT: 'YOUTUBE',
  YOUTUBE_VLOG: 'YOUTUBE',
  LINKEDIN_POST: 'LINKEDIN',
  X_POST: 'TWITTER',
  X_THREAD: 'TWITTER',
  TIKTOK_VIDEO: 'TIKTOK',
  FACEBOOK_POST: 'FACEBOOK',
  FACEBOOK_REEL: 'FACEBOOK',
  FACEBOOK_STORY: 'FACEBOOK',
  THREADS_POST: 'THREADS',
  PINTEREST_PIN: 'PINTEREST',
  SNAPCHAT_STORY: 'SNAPCHAT',
  SNAPCHAT_SPOTLIGHT: 'SNAPCHAT',
  TWITCH_STREAM_MENTION: 'TWITCH',
  PRODUCT_REVIEW: null,
  TESTIMONIAL_VIDEO: null,
  PRODUCT_DEMO: null,
  UNBOXING_VIDEO: null,
};

const PROFILE_TYPES: ReadonlySet<AssetType> = new Set<AssetType>([
  'LINKEDIN_BANNER',
  'LINKEDIN_FEATURED_POST',
  'X_HEADER',
  'X_PINNED_POST',
  'INSTAGRAM_BIO_LINK',
  'INSTAGRAM_PINNED_POST',
  'YOUTUBE_CHANNEL_BANNER',
  'TIKTOK_BIO_LINK',
  'TIKTOK_PINNED_VIDEO',
  'FACEBOOK_COVER',
  'THREADS_PINNED_POST',
  'PINTEREST_BOARD',
  'TWITCH_PANEL',
]);

/** assetType → category. UGC is exactly the platform-flexible set. */
export const ASSET_TYPE_CATEGORY = Object.fromEntries(
  ASSET_TYPES.map((type) => [
    type,
    ASSET_TYPE_PLATFORM[type] === null
      ? 'UGC_ASSETS'
      : PROFILE_TYPES.has(type)
        ? 'PROFILE_ASSETS'
        : 'CONTENT_ASSETS',
  ])
) as Record<AssetType, AssetCategory>;

/**
 * Why `platform` is wrong for `assetType`, or null when it's fine. A
 * type-locked asset must be on its own network; UGC may be on any.
 */
export function platformMismatch(assetType: AssetType, platform: Platform): string | null {
  const canonical = ASSET_TYPE_PLATFORM[assetType];
  return canonical && platform !== canonical ? `A ${assetType} must be on ${canonical}` : null;
}
