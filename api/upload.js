import { put } from '@vercel/blob';

// Tell Vercel not to parse the body — we stream it raw to Blob
export const config = {
  api: { bodyParser: false },
};

// Keep in sync with src/lib/constants.js ALLOWED_MIME_TYPES
const ALLOWED_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml', 'image/webp',
  'image/tiff', 'image/bmp', 'image/avif', 'image/heic', 'image/heif',
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/ogg',
  'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac',
  'audio/aac', 'audio/x-m4a',
]);

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

// Simple in-memory rate limiter (resets on cold start)
const RATE_WINDOW = 60_000; // 1 minute
const RATE_LIMIT  = 10;     // max uploads per IP per window
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
    return res.status(429).json({ error: 'Too many uploads. Try again in a minute.' });
  }

  // ── Validate headers ──────────────────────────────────────
  const rawName    = req.headers['x-filename'];
  const rawSize    = req.headers['x-filesize'];
  const mimeType   = req.headers['content-type'] || 'application/octet-stream';

  if (!rawName) return res.status(400).json({ error: 'Missing x-filename header' });

  const filename = decodeURIComponent(rawName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const filesize = rawSize ? parseInt(rawSize, 10) : 0;

  if (!ALLOWED_TYPES.has(mimeType)) {
    return res.status(400).json({ error: `Unsupported file type: ${mimeType}` });
  }
  if (filesize > MAX_BYTES) {
    return res.status(400).json({ error: "That file's too big. Max size is 50MB." });
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
