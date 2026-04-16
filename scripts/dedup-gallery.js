#!/usr/bin/env node
/**
 * DJPEPE.WTF — Gallery Dedup
 * Run: node scripts/dedup-gallery.js
 *
 * Deletes duplicate blobs from Vercel Blob storage.
 * Keeps the OLDEST copy of each file (by uploadedAt).
 *
 * Requires: BLOB_READ_WRITE_TOKEN in env
 */

import { list, del } from '@vercel/blob';

async function dedup() {
  console.log('🔍 Fetching all gallery blobs...');

  let allBlobs = [];
  let cursor = undefined;
  do {
    const result = await list({ prefix: 'gallery/', limit: 1000, cursor });
    allBlobs = allBlobs.concat(result.blobs);
    cursor = result.cursor;
    console.log(`  Fetched ${allBlobs.length} blobs so far...`);
  } while (cursor);

  console.log(`\n📊 Total blobs: ${allBlobs.length}`);

  // Group by file size — same size = same content
  const sizeMap = new Map();
  for (const blob of allBlobs) {
    if (!blob.size) continue;
    if (!sizeMap.has(blob.size)) sizeMap.set(blob.size, []);
    sizeMap.get(blob.size).push(blob);
  }

  // Keep oldest per size group, delete the rest
  const toDelete = [];
  for (const [, blobs] of sizeMap) {
    if (blobs.length === 1) continue;
    const sorted = blobs.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
    toDelete.push(...sorted.slice(1));
  }

  console.log(`🗑️  Duplicates to delete: ${toDelete.length}`);
  console.log(`✅  Unique files to keep: ${allBlobs.length - toDelete.length}`);

  if (toDelete.length === 0) { console.log('\n✅ No duplicates found!'); return; }

  // Delete in batches of 20
  const BATCH = 20;
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += BATCH) {
    const batch = toDelete.slice(i, i + BATCH);
    try {
      await del(batch.map(b => b.url));
      deleted += batch.length;
      console.log(`  Deleted ${deleted}/${toDelete.length}...`);
    } catch (err) {
      console.error(`  Batch error:`, err.message);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n🏁 Done! Deleted ${deleted} duplicates. Gallery now has ${allBlobs.length - deleted} unique files.`);
}

dedup().catch(console.error);
