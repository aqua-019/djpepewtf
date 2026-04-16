#!/usr/bin/env node
/**
 * DJPEPE.WTF — Bulk MP3 Uploader
 * Run: BLOB_READ_WRITE_TOKEN=xxx node scripts/upload-mp3s.mjs [./path/to/mp3s]
 *
 * Uploads all .mp3 files from the given directory (default: ./mp3s) to
 * gallery/ in Vercel Blob with deterministic filenames (no random suffix).
 */

import { put } from '@vercel/blob';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const DIR = process.argv[2] || './mp3s';

async function upload() {
  let files;
  try {
    files = (await readdir(DIR)).filter(f => f.toLowerCase().endsWith('.mp3'));
  } catch {
    console.error(`Directory not found: ${DIR}`);
    process.exit(1);
  }

  if (!files.length) {
    console.log(`No .mp3 files found in ${DIR}`);
    return;
  }

  console.log(`Uploading ${files.length} MP3(s) from ${DIR}...`);
  let ok = 0;
  for (const file of files) {
    try {
      const buf = await readFile(join(DIR, file));
      const blob = await put(`gallery/${file}`, buf, {
        access: 'public',
        contentType: 'audio/mpeg',
        addRandomSuffix: false,
      });
      console.log(`  ✓ ${file} → ${blob.url}`);
      ok++;
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }
  console.log(`\nDone. ${ok}/${files.length} uploaded.`);
}

upload().catch(console.error);
