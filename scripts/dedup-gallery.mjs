#!/usr/bin/env node
/**
 * DJPEPE.WTF — Gallery Dedup (stem-based)
 * Run: BLOB_READ_WRITE_TOKEN=xxx node scripts/dedup-gallery.mjs [--dry-run]
 *
 * Groups gallery blobs by normalized stem (strips Vercel random suffix).
 * Keeps the OLDEST copy of each logical file, deletes the rest.
 * Pass --dry-run to preview without deleting.
 */

import { list, del } from '@vercel/blob';

const DRY_RUN = process.argv.includes('--dry-run');
const SUFFIX_RE = /-[A-Za-z0-9]{15,25}(\.[^.]+)$/;
const stem = (name) => name.replace(SUFFIX_RE, '$1');

async function dedup() {
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no deletions)' : 'LIVE'}`);
  console.log('Fetching all gallery blobs...');

  let allBlobs = [], cursor;
  do {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('list() timed out after 15s')), 15000)
    );
    const r = await Promise.race([
      list({ prefix: 'gallery/', limit: 1000, cursor }),
      timeout,
    ]);
    allBlobs = allBlobs.concat(r.blobs);
    cursor = r.cursor;
    console.log(`  Fetched ${allBlobs.length} blobs so far...`);
  } while (cursor);

  const media = allBlobs.filter(b => !b.pathname.endsWith('manifest.json'));
  console.log(`\nTotal media blobs: ${media.length}`);

  const groups = new Map();
  for (const b of media) {
    const s = stem(b.pathname.split('/').pop());
    if (!groups.has(s)) groups.set(s, []);
    groups.get(s).push(b);
  }

  const toDelete = [];
  for (const [, blobs] of groups) {
    if (blobs.length === 1) continue;
    const sorted = blobs.sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt));
    toDelete.push(...sorted.slice(1));
  }

  console.log(`Duplicates to delete: ${toDelete.length}`);
  console.log(`Unique files to keep: ${media.length - toDelete.length}`);

  if (!toDelete.length) { console.log('\nNo duplicates found!'); return; }

  if (DRY_RUN) {
    console.log('\nWould delete:');
    for (const b of toDelete) console.log(`  - ${b.pathname}`);
    console.log('\nRe-run without --dry-run to delete.');
    return;
  }

  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 20) {
    const batch = toDelete.slice(i, i + 20);
    try {
      await del(batch.map(b => b.url));
      deleted += batch.length;
      console.log(`  Deleted ${deleted}/${toDelete.length}...`);
    } catch (err) {
      console.error(`  Batch error:`, err.message);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nDone! Deleted ${deleted} duplicates. Gallery now has ${media.length - deleted} unique files.`);
}

dedup().catch(console.error);
