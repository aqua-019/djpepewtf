/**
 * api/_manifest.js
 * ─────────────────────────────────────────────────────────────
 * Manages gallery/manifest.json in Vercel Blob.
 * Source of truth for dedup — maps SHA-256 → file record.
 *
 * Manifest shape:
 * {
 *   "abc123...": { url, pathname, name, size, type, uploadedAt },
 *   ...
 * }
 */

import { put, head } from '@vercel/blob';

const MANIFEST_PATH = 'gallery/manifest.json';
const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;

/** Fetch the current manifest from Blob. Returns {} if not yet created. */
export async function readManifest(token = TOKEN) {
  try {
    const info = await head(MANIFEST_PATH, { token });
    const res = await fetch(info.url + `?bust=${Date.now()}`);
    if (!res.ok) return {};
    return await res.json();
  } catch {
    return {};
  }
}

/** Write the full manifest back to Blob (overwrites). */
export async function writeManifest(manifest, token = TOKEN) {
  await put(MANIFEST_PATH, JSON.stringify(manifest), {
    access: 'public',
    contentType: 'application/json',
    token,
  });
}

/** Check if a SHA-256 hash is already in the manifest. Returns record or null. */
export function findDuplicate(manifest, hash) {
  return manifest[hash] ?? null;
}

/** Register a newly uploaded file. Call AFTER the blob has been stored. */
export function registerFile(manifest, hash, record) {
  return { ...manifest, [hash]: record };
}
