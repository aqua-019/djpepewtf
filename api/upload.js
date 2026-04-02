import { put } from '@vercel/blob';

// Tell Vercel not to parse the body — we stream it raw to Blob
export const config = {
  api: { bodyParser: false },
};

// Extension → MIME fallback for files browsers can't detect (HEIC, MOV, etc.)
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

const MAX_BYTES = 150 * 1024 * 1024; // 150 MB

// Simple in-memory rate limiter (resets on cold start)
const RATE_WINDOW = 60_000; // 1 minute
const RATE_LIMIT  = 600;    // raised for bulk uploads (340+ files)
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

export default async function handler(req, res) {
  // ── CORS headers ─────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-filename, x-filesize');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Rate limit ────────────────────────────────────────────
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (isRateLimited(ip)) {
    res.setHeader('Retry-After', '10');
    return res.status(429).json({ error: 'Too many uploads. Try again shortly.' });
  }

  // ── Validate headers ──────────────────────────────────────
  const rawName    = req.headers['x-filename'];
  const rawSize    = req.headers['x-filesize'];
  let   mimeType   = req.headers['content-type'] || '';

  if (!rawName) return res.status(400).json({ error: 'Missing x-filename header' });

  const filename = decodeURIComponent(rawName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const filesize = rawSize ? parseInt(rawSize, 10) : 0;
  const ext = filename.split('.').pop().toLowerCase();

  // Resolve MIME: use browser-provided type, fall back to extension map, then octet-stream
  if (!mimeType || mimeType === 'application/octet-stream') {
    mimeType = EXT_MIME[ext] || 'application/octet-stream';
  }

  if (filesize > MAX_BYTES) {
    return res.status(400).json({ error: "That file's too big. Max size is 150MB." });
  }

  // ── Stream to Vercel Blob ─────────────────────────────────
  try {
    const blob = await put(`gallery/${filename}`, req, {
      access:      'public',
      contentType: mimeType,
      addRandomSuffix: true,
    });

    return res.status(200).json({
      url:         blob.url,
      pathname:    blob.pathname,
      filename:    filename,
      mimeType:    mimeType,
      size:        filesize,
      uploadedAt:  new Date().toISOString(),
    });
  } catch (err) {
    console.error('[upload]', err);
    return res.status(500).json({ error: 'Upload failed. Try again.' });
  }
}
