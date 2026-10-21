/**
 * Move stored asset types onto the shared catalogue (src/types/assets.ts).
 *
 *   pnpm tsx scripts/migrate-asset-types.ts           # dry run: report only
 *   pnpm tsx scripts/migrate-asset-types.ts --apply   # rewrite
 *
 * Idempotent: a second run finds nothing to change. Writes through the raw
 * collections, because the old values no longer pass the models' enums.
 *
 * Stops before writing if a rename would give a creator two ACCEPTED
 * applications for the same asset type (the per-asset lock's unique index).
 */
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '@/config/database';
import { logger } from '@/config/logger';
import { ASSET_TYPES, ASSET_TYPE_PLATFORM, type AssetType } from '@/types/assets';

const COLLECTIONS = ['campaigns', 'applications', 'contracts', 'submissions', 'assets'] as const;

/** Old value → new value. BIO_MENTION is resolved per platform below. */
const RENAMES: Record<string, AssetType> = {
  TWITTER_PINNED_POST: 'X_PINNED_POST',
  X_PINNED_TWEET: 'X_PINNED_POST',
  TWITTER_HEADER: 'X_HEADER',
  UGC_CONTENT: 'PRODUCT_REVIEW',
};

/** A bio mention becomes the bio link of its own network where one exists. */
function bioLinkFor(platform: unknown): { assetType: AssetType; platform: string } {
  if (platform === 'TIKTOK') return { assetType: 'TIKTOK_BIO_LINK', platform: 'TIKTOK' };
  return { assetType: 'INSTAGRAM_BIO_LINK', platform: 'INSTAGRAM' };
}

interface Change {
  collection: string;
  id: mongoose.Types.ObjectId;
  from: string;
  to: AssetType;
  platformFrom?: string;
  platformTo?: string;
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  await connectDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('No database handle');

  const known = new Set<string>(ASSET_TYPES);
  const changes: Change[] = [];
  const unknown: string[] = [];

  for (const name of COLLECTIONS) {
    const docs = await db
      .collection(name)
      .find(
        { assetType: { $nin: [...ASSET_TYPES] } },
        { projection: { assetType: 1, platform: 1 } }
      )
      .toArray();
    for (const doc of docs) {
      const from = String(doc.assetType);
      if (from === 'BIO_MENTION') {
        const target = bioLinkFor(doc.platform);
        changes.push({
          collection: name,
          id: doc._id,
          from,
          to: target.assetType,
          ...(doc.platform !== target.platform
            ? { platformFrom: String(doc.platform), platformTo: target.platform }
            : {}),
        });
      } else if (RENAMES[from]) {
        changes.push({ collection: name, id: doc._id, from, to: RENAMES[from] });
      } else if (!known.has(from)) {
        unknown.push(`${name}/${doc._id.toString()}: ${from}`);
      }
    }
  }

  // Platform sanity for everything already on the new list (type-locked assets).
  const mismatched: string[] = [];
  for (const name of COLLECTIONS) {
    const docs = await db
      .collection(name)
      .find({ assetType: { $in: [...ASSET_TYPES] } }, { projection: { assetType: 1, platform: 1 } })
      .toArray();
    for (const doc of docs) {
      const canonical = ASSET_TYPE_PLATFORM[doc.assetType as AssetType];
      if (canonical && doc.platform && doc.platform !== canonical) {
        mismatched.push(`${name}/${doc._id.toString()}: ${doc.assetType} on ${doc.platform}`);
      }
    }
  }

  // Per-asset lock: no creator may end up with two ACCEPTED apps of one type.
  const accepted = await db
    .collection('applications')
    .find({ status: 'ACCEPTED' }, { projection: { creatorId: 1, assetType: 1 } })
    .toArray();
  const renamedApps = new Map(
    changes.filter((c) => c.collection === 'applications').map((c) => [c.id.toString(), c.to])
  );
  const seen = new Map<string, number>();
  for (const app of accepted) {
    const type = renamedApps.get(app._id.toString()) ?? String(app.assetType);
    const key = `${String(app.creatorId)}:${type}`;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  const collisions = [...seen.entries()].filter(([, n]) => n > 1).map(([k]) => k);

  for (const c of changes) {
    logger.info(
      `${apply ? 'MIGRATE' : 'WOULD MIGRATE'}  ${c.collection}/${c.id.toString()}  ${c.from} → ${c.to}` +
        (c.platformTo ? `  (platform ${c.platformFrom} → ${c.platformTo})` : '')
    );
  }
  for (const u of unknown) logger.error(`UNKNOWN  ${u}`);
  for (const m of mismatched) logger.warn(`PLATFORM  ${m}`);
  for (const k of collisions) logger.error(`COLLISION  accepted applications ${k}`);

  if (apply) {
    if (collisions.length || unknown.length) {
      throw new Error('Refusing to write: resolve the collisions/unknown values above first');
    }
    for (const c of changes) {
      await db
        .collection(c.collection)
        .updateOne(
          { _id: c.id, assetType: c.from },
          { $set: { assetType: c.to, ...(c.platformTo ? { platform: c.platformTo } : {}) } }
        );
    }
  }

  logger.info(
    `migrate-asset-types: ${changes.length} change(s) ${apply ? 'applied' : 'pending'}, ` +
      `${unknown.length} unknown, ${mismatched.length} platform mismatch(es), ${collisions.length} collision(s)`
  );
  await disconnectDatabase();
  process.exitCode = unknown.length || collisions.length ? 1 : 0;
}

main().catch((error: unknown) => {
  logger.error('migrate-asset-types failed', {
    error: error instanceof Error ? error.message : error,
  });
  process.exitCode = 1;
});
