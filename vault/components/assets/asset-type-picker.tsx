"use client";

import { ChoicePills } from "@/components/ui/choice-pills";
import { Field } from "@/components/ui/field";
import {
  ASSET_TYPE_PLATFORM,
  ASSET_TYPES_BY_CATEGORY,
  PLATFORMS,
  type AssetCategory,
  type AssetType,
  type Platform,
} from "@/lib/api/types";
import { ASSET_CATEGORY_LABEL, ASSET_TYPE_LABEL, PLATFORM_LABEL } from "@/lib/config/labels";

/** Types that can run on `platform`: its own, plus the platform-flexible UGC. */
export function typesForPlatform(platform: Platform | undefined): Record<AssetCategory, AssetType[]> {
  const fits = (t: AssetType) => {
    const home = ASSET_TYPE_PLATFORM[t];
    return home === null || (platform !== undefined && home === platform);
  };
  return {
    PROFILE_ASSETS: ASSET_TYPES_BY_CATEGORY.PROFILE_ASSETS.filter(fits),
    CONTENT_ASSETS: ASSET_TYPES_BY_CATEGORY.CONTENT_ASSETS.filter(fits),
    UGC_ASSETS: ASSET_TYPES_BY_CATEGORY.UGC_ASSETS.filter(fits),
  };
}

/**
 * Where it runs, then what it is.
 *
 * Asking for the platform first means every type offered is one that can
 * actually run there — the backend refuses a mismatched pair, and a picker that
 * only shows valid pairs can't produce one. UGC is made for the brand to use
 * anywhere, so it's offered on every platform.
 */
export function AssetTypePicker({
  platform,
  assetType,
  onChange,
  platformError,
  typeError,
}: {
  platform: Platform | undefined;
  assetType: AssetType | undefined;
  onChange: (next: { platform: Platform | undefined; assetType: AssetType | undefined }) => void;
  platformError?: string | undefined;
  typeError?: string | undefined;
}) {
  const groups = typesForPlatform(platform);

  const pickPlatform = (next: Platform) => {
    // Keep the type only if it still fits the new platform.
    const keep =
      assetType !== undefined &&
      (ASSET_TYPE_PLATFORM[assetType] === null || ASSET_TYPE_PLATFORM[assetType] === next);
    onChange({ platform: next, assetType: keep ? assetType : undefined });
  };

  return (
    <div className="space-y-4">
      <Field label="Platform" htmlFor="platform" required error={platformError}>
        <ChoicePills
          id="platform"
          label="Platform"
          options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABEL[p] }))}
          value={platform}
          onChange={pickPlatform}
          invalid={Boolean(platformError)}
        />
      </Field>

      <Field label="Asset" htmlFor="assetType" required error={typeError}>
        {platform === undefined ? (
          <p id="assetType" className="text-muted text-[12px]">
            Pick a platform to see the assets that run on it.
          </p>
        ) : (
          <div id="assetType" className="space-y-3">
            {(Object.keys(groups) as AssetCategory[])
              .filter((category) => groups[category].length > 0)
              .map((category) => (
                <div key={category}>
                  <p className="text-muted mb-1.5 text-[11px]">{ASSET_CATEGORY_LABEL[category]}</p>
                  <ChoicePills
                    id={`assetType-${category}`}
                    label={`${ASSET_CATEGORY_LABEL[category]} assets`}
                    options={groups[category].map((t) => ({ value: t, label: ASSET_TYPE_LABEL[t] }))}
                    value={assetType && groups[category].includes(assetType) ? assetType : undefined}
                    onChange={(t) => onChange({ platform, assetType: t })}
                    invalid={Boolean(typeError)}
                  />
                </div>
              ))}
          </div>
        )}
      </Field>
    </div>
  );
}
