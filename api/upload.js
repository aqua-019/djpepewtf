import { put } from '@vercel/blob';
import { createHash } from 'crypto';

// Tell Vercel not to parse the body — we read it raw
export const config = {
  api: { bodyParser: false },
};

// Extension → MIME fallback
const EXT_MIME = {
  heic: 'image/heic', heif: 'image/heif',
  mov: 'video/quicktime', qt: 'video/quicktime',
  mp4: 'video/mp4', webm: 'video/webm', avi: 'video/x-msvideo', ogv: 'video/ogg',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', flac: 'audio/flac',
  aac: 'audio/aac', m4a: 'audio/x-m4a',
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
  svg: 'image/svg+xml', webp: 'image/webp', tiff: 'image/tiff', bmp: 'image/bmp',
  avif: 'image/avif', pdf: 'application/pdf',
};

const MAX_BYTES = 150 * 1024 * 1024;

// Rate limiter (resets on cold start)
const RATE_WINDOW = 60_000;
const RATE_LIMIT  = 30;
const ipLog = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const entry = ipLog.get(ip);
  if (!entry || now - entry.start > RATE_WINDOW) {
    ipLog.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Lazy-load manifest helpers — if import fails, dedup is skipped
let manifestModule = null;
async function getManifestModule() {
  if (manifestModule) return manifestModule;
  try {
    manifestModule = await import('./_manifest.js');
    return manifestModule;
  } catch (e) {
    console.warn('[upload] _manifest.js import failed:', e.message);
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-filename, x-filesize, x-hash');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    res.setHeader('Retry-After', '10');
    return res.status(429).json({ error: 'Too many uploads. Try again shortly.' });
  }

  const rawName    = req.headers['x-filename'];
  const rawSize    = req.headers['x-filesize'];
  const clientHash = req.headers['x-hash'] || null;
  let   mimeType   = req.headers['content-type'] || '';

  if (!rawName) return res.status(400).json({ error: 'Missing x-filename header' });

  const filename = decodeURIComponent(rawName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const filesize = rawSize ? parseInt(rawSize, 10) : 0;
  const ext = filename.split('.').pop().toLowerCase();

  if (!mimeType || mimeType === 'application/octet-stream') {
    mimeType = EXT_MIME[ext] || 'application/octet-stream';
  }

  if (filesize > MAX_BYTES) {
    return res.status(400).json({ error: "That file's too big. Max size is 150MB." });
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);

    const serverHash = createHash('sha256').update(buffer).digest('hex');

    if (clientHash && clientHash !== serverHash) {
      return res.status(400).json({ error: 'Hash mismatch — corrupted upload' });
    }

    // Dedup check (best-effort)
    const m = await getManifestModule();
    let manifest = {};
    if (m) {
      try {
        manifest = await m.readManifest();
        const existing = m.findDuplicate(manifest, serverHash);
        if (existing) {
          return res.status(409).json({
            ok: false, duplicate: true,
            message: 'This file already exists in the archive.',
            existing: { url: existing.url, name: existing.name, uploadedAt: existing.uploadedAt },
          });
        }
      } catch (e) {
        console.warn('[upload] manifest read failed:', e.message);
      }
    }

    // Upload to Vercel Blob (critical path)
    const blob = await put(`gallery/${filename}`, buffer, {
      access:      'public',
      contentType: mimeType,
      addRandomSuffix: true,
    });

    const uploadedAt = new Date().toISOString();

    // Register in manifest (best-effort)
    if (m) {
      try {
        const record = {
          url: blob.url, pathname: blob.pathname,
          name: filename, size: buffer.length,
          type: mimeType, uploadedAt,
        };
        const updated = m.registerFile(manifest, serverHash, record);
        await m.writeManifest(updated);
      } catch (e) {
        console.warn('[upload] manifest write failed:', e.message);
      }
    }

    return res.status(200).json({
      url:         blob.url,
      pathname:    blob.pathname,
      filename,
      mimeType,
      size:        buffer.length,
      uploadedAt,
      isDuplicate: false,
    });
  } catch (err) {
    console.error('[upload]', err);
    return res.status(500).json({ error: 'Upload failed. Try again.' });
  }
}
