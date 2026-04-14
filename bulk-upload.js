#!/usr/bin/env node
/**
 * DJPEPE.WTF — Bulk Gallery Upload (v2, hash-based dedup)
 * ─────────────────────────────────────────────────────────
 * Reads gallery/manifest.json from Vercel Blob.
 * Computes SHA-256 of each local file.
 * Skips files whose hash is already in the manifest.
 * Uploads genuinely new files and updates the manifest.
 *
 * Usage:
 *   node bulk-upload.js                          → diff by hash (safe default)
 *   node bulk-upload.js --wipe                   → delete all gallery blobs + manifest, re-upload all
 *   node bulk-upload.js --dry-run                → show plan without touching anything
 *   node bulk-upload.js --folder /path/to/files  → custom source folder
 *   node bulk-upload.js --concurrency 4          → parallel uploads (default: 3)
 *
 * Setup:
 *   npm install @vercel/blob dotenv
 *   # .env.local must have BLOB_READ_WRITE_TOKEN=...
 */

import { put, list, del, head } from "@vercel/blob";
import { readFileSync, readdirSync, statSync, createHash } from "fs";
import { join, extname, basename } from "path";
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

// ── Config ────────────────────────────────────────────────────

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!TOKEN) {
  console.error("❌  BLOB_READ_WRITE_TOKEN not found in .env.local");
  process.exit(1);
}

const ARGS        = process.argv.slice(2);
const WIPE        = ARGS.includes("--wipe");
const DRY_RUN     = ARGS.includes("--dry-run");
const FOLDER_IDX  = ARGS.indexOf("--folder");
const CONCURR_IDX = ARGS.indexOf("--concurrency");

const LOCAL_FOLDER  = FOLDER_IDX  !== -1 ? ARGS[FOLDER_IDX  + 1] : "./public/memes";
const CONCURRENCY   = CONCURR_IDX !== -1 ? parseInt(ARGS[CONCURR_IDX + 1], 10) : 3;
const BLOB_PREFIX   = "gallery/";
const MANIFEST_PATH = "gallery/manifest.json";

const SUPPORTED = new Set([
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".mp4", ".svg",
  ".mp3", ".wav", ".ogg", ".flac", ".aac", ".m4a",
  ".webm", ".mov", ".avi", ".ogv",
  ".heic", ".heif", ".avif", ".tiff", ".bmp",
]);

const MIME = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".gif": "image/gif",  ".webp": "image/webp",  ".mp4": "video/mp4",
  ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".wav": "audio/wav",
  ".ogg": "audio/ogg", ".flac": "audio/flac", ".aac": "audio/aac",
  ".m4a": "audio/x-m4a", ".webm": "video/webm", ".mov": "video/quicktime",
  ".avi": "video/x-msvideo", ".ogv": "video/ogg",
  ".heic": "image/heic", ".heif": "image/heif",
  ".avif": "image/avif", ".tiff": "image/tiff", ".bmp": "image/bmp",
};

// ── Manifest ──────────────────────────────────────────────────

async function readManifest() {
  try {
    const info = await head(MANIFEST_PATH, { token: TOKEN });
    const res  = await fetch(info.url + `?bust=${Date.now()}`);
    return res.ok ? await res.json() : {};
  } catch {
    return {};
  }
}

async function writeManifest(manifest) {
  await put(MANIFEST_PATH, JSON.stringify(manifest, null, 2), {
    access: "public", contentType: "application/json", token: TOKEN,
  });
}

// ── Helpers ───────────────────────────────────────────────────

function sha256file(filepath) {
  const buf = readFileSync(filepath);
  return createHash("sha256").update(buf).digest("hex");
}

function formatBytes(b) {
  if (b < 1024)         return `${b}B`;
  if (b < 1024 * 1024)  return `${(b / 1024).toFixed(1)}KB`;
  return `${(b / (1024 * 1024)).toFixed(1)}MB`;
}

function getLocalFiles(folder) {
  try {
    return readdirSync(folder)
      .filter((f) => SUPPORTED.has(extname(f).toLowerCase()))
      .map((f) => ({
        name: f,
        ext:  extname(f).toLowerCase(),
        path: join(folder, f),
        size: statSync(join(folder, f)).size,
      }));
  } catch {
    console.error(`❌  Folder not found: ${folder}`);
    console.error(`   Create it and drop files in, or use --folder ./path`);
    process.exit(1);
  }
}

async function getAllBlobs() {
  const blobs = [];
  let cursor;
  do {
    const r = await list({ prefix: BLOB_PREFIX, cursor, token: TOKEN });
    blobs.push(...r.blobs.filter((b) => !b.pathname.endsWith("manifest.json")));
    cursor = r.cursor;
  } while (cursor);
  return blobs;
}

// ── Concurrency pool ──────────────────────────────────────────

async function pool(tasks, limit, fn) {
  const results = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await fn(tasks[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

// ── Main ──────────────────────────────────────────────────────

async function main() {
  console.log("\n🐸  DJPEPE.WTF — Bulk Gallery Upload v2");
  console.log("─".repeat(48));
  if (DRY_RUN) console.log("🔍  DRY RUN — nothing will be changed\n");
  if (WIPE)    console.log("⚠️   WIPE MODE — gallery will be cleared first\n");

  // 1. Local files
  const localFiles = getLocalFiles(LOCAL_FOLDER);
  console.log(`📁  Local folder : ${LOCAL_FOLDER}`);
  console.log(`📄  Local files  : ${localFiles.length}`);

  if (localFiles.length === 0) {
    console.log("\n⚠️   No supported files found.");
    return;
  }

  // 2. Read manifest (hash registry)
  console.log(`\n⏳  Reading manifest from Blob...`);
  let manifest = await readManifest();
  const manifestSize = Object.keys(manifest).length;
  console.log(`📋  Manifest     : ${manifestSize} registered files`);

  // 3. WIPE
  if (WIPE) {
    const blobs = await getAllBlobs();
    console.log(`\n🗑️   Wiping ${blobs.length} blobs + manifest...`);
    if (!DRY_RUN) {
      const BATCH = 20;
      for (let i = 0; i < blobs.length; i += BATCH) {
        const urls = blobs.slice(i, i + BATCH).map((b) => b.url);
        await Promise.all(urls.map((u) => del(u, { token: TOKEN })));
        process.stdout.write(`\r   Deleted ${Math.min(i + BATCH, blobs.length)}/${blobs.length}`);
      }
      // Also wipe manifest
      try {
        const mInfo = await head(MANIFEST_PATH, { token: TOKEN });
        await del(mInfo.url, { token: TOKEN });
      } catch { /* manifest may not exist */ }
      console.log("\n✅  Wipe complete");
      manifest = {};
    } else {
      console.log("   (skipped — dry run)");
    }
  }

  // 4. Hash all local files + diff against manifest
  console.log(`\n🔐  Hashing local files...`);
  const existingHashes = new Set(Object.keys(manifest));

  const tagged = localFiles.map((f) => {
    const hash = sha256file(f.path);
    const isNew = !existingHashes.has(hash);
    return { ...f, hash, isNew };
  });

  const toUpload  = tagged.filter((f) => f.isNew);
  const skipped   = tagged.filter((f) => !f.isNew);
  const totalSize = toUpload.reduce((acc, f) => acc + f.size, 0);

  console.log(`\n📊  Upload plan:`);
  console.log(`    New files  : ${toUpload.length}`);
  console.log(`    Duplicates : ${skipped.length} (same content already in archive)`);
  console.log(`    Total size : ${formatBytes(totalSize)}`);

  if (skipped.length > 0) {
    console.log(`\n    Skipped duplicates:`);
    skipped.forEach((f) => console.log(`    ↳ ${f.name}`));
  }

  if (toUpload.length === 0) {
    console.log("\n✅  Nothing new to upload. Archive is up to date.");
    return;
  }

  if (DRY_RUN) {
    console.log(`\n🔍  Would upload:`);
    toUpload.forEach((f) => console.log(`    + ${f.name} (${formatBytes(f.size)})`));
    return;
  }

  // 5. Upload with concurrency
  console.log(`\n⬆️   Uploading ${toUpload.length} files (${CONCURRENCY} at a time)...\n`);

  let uploaded = 0;
  let failed   = 0;
  const failures = [];
  const newManifestEntries = {};

  await pool(toUpload, CONCURRENCY, async (file) => {
    const blobPath = `${BLOB_PREFIX}${file.name}`;
    try {
      const buffer = readFileSync(file.path);
      const blob   = await put(blobPath, buffer, {
        access:      "public",
        contentType: MIME[file.ext] ?? "application/octet-stream",
        token:       TOKEN,
        addRandomSuffix: true,
      });

      newManifestEntries[file.hash] = {
        url:        blob.url,
        pathname:   blob.pathname,
        name:       file.name,
        size:       file.size,
        type:       MIME[file.ext] ?? "application/octet-stream",
        uploadedAt: new Date().toISOString(),
      };

      uploaded++;
      process.stdout.write(
        `\r   ✅  ${uploaded + failed}/${toUpload.length}  ${file.name.slice(0, 36).padEnd(36)}`
      );
    } catch (err) {
      failed++;
      failures.push({ name: file.name, error: err.message });
      process.stdout.write(
        `\r   ❌  ${file.name.slice(0, 36)} — ${err.message}\n`
      );
    }
  });

  // 6. Update manifest with all successful uploads at once
  if (uploaded > 0) {
    console.log(`\n\n📝  Updating manifest (+${uploaded} entries)...`);
    const finalManifest = { ...manifest, ...newManifestEntries };
    await writeManifest(finalManifest);
    console.log(`✅  Manifest saved (${Object.keys(finalManifest).length} total files)`);
  }

  // 7. Summary
  console.log(`\n${"─".repeat(48)}`);
  console.log(`✅  Uploaded : ${uploaded}`);
  console.log(`⏭️   Skipped  : ${skipped.length} (duplicates by content hash)`);
  if (failed > 0) {
    console.log(`❌  Failed   : ${failed}`);
    failures.forEach((f) => console.log(`   ${f.name}: ${f.error}`));
    console.log(`\n   Re-run to retry failed files only.`);
  }
  console.log(`\n🐸  Done.\n`);
}

main().catch((err) => {
  console.error("\n❌  Fatal:", err.message);
  process.exit(1);
});
