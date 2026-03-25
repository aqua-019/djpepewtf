import { put } from '@vercel/blob';

// Tell Vercel not to parse the body — we stream it raw to Blob
export const config = {
  api: { bodyParser: false },
};

const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/svg+xml',
  'image/webp',
  'video/mp4',
  'video/webm',
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
]);

const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export default async function handler(req, res) {
  // ── CORS headers ─────────────────────────────────────────
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-filename, x-filesize');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // ── Validate headers ──────────────────────────────────────
  const rawName    = req.headers['x-filename'];
  const rawSize    = req.headers['x-filesize'];
  const mimeType   = req.headers['content-type'] || 'application/octet-stream';

  if (!rawName) return res.status(400).json({ error: 'Missing x-filename header' });

  const filename = decodeURIComponent(rawName).replace(/[^a-zA-Z0-9._\-]/g, '_');
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
      addRandomSuffix: true, // avoids collisions on duplicate filenames
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
