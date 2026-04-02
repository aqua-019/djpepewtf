#!/usr/bin/env node
/**
 * batch-upload-gdrive.mjs
 *
 * Fetches all files from a public Google Drive folder and uploads them
 * to the DJPEPE.WTF gallery via /api/upload.
 *
 * Usage:
 *   GOOGLE_API_KEY=xxx node scripts/batch-upload-gdrive.mjs <FOLDER_ID> [UPLOAD_URL]
 *
 * Examples:
 *   GOOGLE_API_KEY=AIza... node scripts/batch-upload-gdrive.mjs 1aBcDeFgHiJkLmNoPqRsT
 *   GOOGLE_API_KEY=AIza... node scripts/batch-upload-gdrive.mjs 1aBcDeFgHiJkLmNoPqRsT https://djpepe.wtf/api/upload
 *
 * Requirements:
 * - The folder must be shared as "Anyone with the link can view"
 * - A Google API key is required (free, from console.cloud.google.com)
 *   Enable "Google Drive API" and create an API key (no OAuth needed)
 *
 * Rate limiting: the upload API allows 10 uploads/min per IP.
 * This script uploads in batches of 8 with a 65s pause between batches.
 */

const GOOGLE_API = 'https://www.googleapis.com/drive/v3';
const DEFAULT_UPLOAD_URL = 'https://djpepe.wtf/api/upload';

const MIME_MAP = {
  'image/png': 'image/png',
  'image/jpeg': 'image/jpeg',
  'image/gif': 'image/gif',
  'image/svg+xml': 'image/svg+xml',
  'image/webp': 'image/webp',
  'image/tiff': 'image/tiff',
  'image/bmp': 'image/bmp',
  'image/avif': 'image/avif',
  'image/heic': 'image/heic',
  'image/heif': 'image/heif',
  'video/mp4': 'video/mp4',
  'video/webm': 'video/webm',
  'video/quicktime': 'video/quicktime',
  'video/x-msvideo': 'video/x-msvideo',
  'video/ogg': 'video/ogg',
  'audio/mpeg': 'audio/mpeg',
  'audio/mp3': 'audio/mp3',
  'audio/wav': 'audio/wav',
  'audio/ogg': 'audio/ogg',
  'audio/flac': 'audio/flac',
  'audio/aac': 'audio/aac',
  'audio/x-m4a': 'audio/x-m4a',
  'application/pdf': 'application/pdf',
};

const BATCH_SIZE = 8;
const BATCH_PAUSE_MS = 65_000; // 65 seconds between batches

// ── Helpers ──────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

const API_KEY = process.env.GOOGLE_API_KEY || '';

async function listDriveFiles(folderId, pageToken = null) {
  if (!API_KEY) {
    throw new Error('GOOGLE_API_KEY environment variable is required. Get one at console.cloud.google.com (enable Drive API, create API key).');
  }

  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'nextPageToken,files(id,name,mimeType,size)',
    pageSize: '100',
    key: API_KEY,
  });
  if (pageToken) params.set('pageToken', pageToken);

  const url = `${GOOGLE_API}/files?${params}`;
  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Drive API error ${res.status}: ${text}`);
  }

  return res.json();
}

async function getAllFiles(folderId) {
  const allFiles = [];
  let pageToken = null;

  do {
    const data = await listDriveFiles(folderId, pageToken);
    if (data.files) allFiles.push(...data.files);
    pageToken = data.nextPageToken || null;
  } while (pageToken);

  // Filter to supported MIME types
  return allFiles.filter(f => f.mimeType in MIME_MAP);
}

async function downloadFile(fileId) {
  const url = `${GOOGLE_API}/files/${fileId}?alt=media&key=${API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed for ${fileId}: ${res.status}`);
  return res;
}

async function uploadFile(file, uploadUrl) {
  const mime = MIME_MAP[file.mimeType] || file.mimeType;

  // Download from Google Drive
  const dlRes = await downloadFile(file.id);
  const body = await dlRes.arrayBuffer();

  // Upload to our API
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': mime,
      'x-filename': encodeURIComponent(file.name),
      'x-filesize': String(file.size || body.byteLength),
    },
    body: Buffer.from(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ── Main ─────────────────────────────────────────────────────

async function main() {
  const folderId = process.argv[2];
  const uploadUrl = process.argv[3] || DEFAULT_UPLOAD_URL;

  if (!folderId) {
    console.error('Usage: node scripts/batch-upload-gdrive.mjs <FOLDER_ID> [UPLOAD_URL]');
    console.error('');
    console.error('The FOLDER_ID is the part after /folders/ in a Google Drive link:');
    console.error('  https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsT');
    console.error('                                          ^^^^^^^^^^^^^^^^^^^^^^^');
    process.exit(1);
  }

  console.log(`\n📂 Listing files from Google Drive folder: ${folderId}`);
  console.log(`📡 Upload target: ${uploadUrl}\n`);

  let files;
  try {
    files = await getAllFiles(folderId);
  } catch (err) {
    console.error('❌ Could not list Drive folder:', err.message);
    console.error('\nMake sure the folder is shared as "Anyone with the link can view".');
    process.exit(1);
  }

  console.log(`Found ${files.length} supported files.\n`);

  if (files.length === 0) {
    console.log('Nothing to upload.');
    return;
  }

  // Process in batches
  let uploaded = 0;
  let failed = 0;
  const failures = [];

  for (let i = 0; i < files.length; i += BATCH_SIZE) {
    const batch = files.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(files.length / BATCH_SIZE);

    console.log(`── Batch ${batchNum}/${totalBatches} (${batch.length} files) ──`);

    for (const file of batch) {
      try {
        const result = await uploadFile(file, uploadUrl);
        uploaded++;
        console.log(`  ✅ ${file.name} → ${result.url}`);
      } catch (err) {
        failed++;
        failures.push(file.name);
        console.log(`  ❌ ${file.name}: ${err.message}`);
      }
    }

    // Pause between batches to respect rate limit
    if (i + BATCH_SIZE < files.length) {
      const waitSec = Math.ceil(BATCH_PAUSE_MS / 1000);
      console.log(`\n⏳ Waiting ${waitSec}s for rate limit reset...\n`);
      await sleep(BATCH_PAUSE_MS);
    }
  }

  console.log(`\n────────────────────────────────`);
  console.log(`✅ Uploaded: ${uploaded}`);
  console.log(`❌ Failed:   ${failed}`);
  if (failures.length > 0) {
    console.log(`\nFailed files:`);
    failures.forEach(f => console.log(`  - ${f}`));
  }
  console.log();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
