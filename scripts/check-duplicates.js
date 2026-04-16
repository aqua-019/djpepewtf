// scripts/check-duplicates.js
// Check for duplicate meme files by content hash (local) and filename (Vercel Blob)
const { createHash } = require('crypto');
const fs   = require('fs');
const path = require('path');

const MEME_DIR = path.join(__dirname, '../public/memes');

// ── LOCAL DUPLICATE CHECK ──────────────────────────────────────────────────
function checkLocal() {
  if (!fs.existsSync(MEME_DIR)) {
    console.log('ℹ️  No local memes directory found at', MEME_DIR);
    return;
  }

  const files  = fs.readdirSync(MEME_DIR).filter(f => !f.startsWith('.'));
  const hashes = {};
  const dupes  = [];

  for (const f of files) {
    const full = path.join(MEME_DIR, f);
    if (!fs.statSync(full).isFile()) continue;
    const hash = createHash('md5').update(fs.readFileSync(full)).digest('hex');
    if (hashes[hash]) {
      dupes.push({ original: hashes[hash], duplicate: f, hash });
    } else {
      hashes[hash] = f;
    }
  }

  if (dupes.length === 0) {
    console.log('✅ No local duplicates found');
  } else {
    console.log(`⚠️  ${dupes.length} local duplicate(s):`);
    dupes.forEach(d => console.log(`  ${d.duplicate} === ${d.original}  [${d.hash}]`));
    // To auto-delete: uncomment below
    // dupes.forEach(d => fs.unlinkSync(path.join(MEME_DIR, d.duplicate)));
  }
}

// ── BLOB DUPLICATE CHECK ───────────────────────────────────────────────────
async function checkBlob() {
  try {
    const { list } = require('@vercel/blob');
    const { blobs } = await list({ prefix: 'gallery/' });
    const seen = new Set();
    let blobDupes = 0;
    blobs.forEach(b => {
      const name = b.pathname.split('/').pop();
      if (seen.has(name)) {
        console.log('⚠️  BLOB DUPE:', name);
        blobDupes++;
      }
      seen.add(name);
    });
    if (blobDupes === 0) console.log('✅ No blob duplicates found');
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log('ℹ️  @vercel/blob not available — skipping blob check');
    } else {
      console.error('Blob check error:', err.message);
    }
  }
}

checkLocal();
checkBlob();
