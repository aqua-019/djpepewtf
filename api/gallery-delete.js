import { del } from '@vercel/blob';
import crypto from 'crypto';

/**
 * POST /api/gallery-delete
 * Body: { "url": "https://...blob.vercelcdn.com/gallery/..." }
 *
 * Deletes a single blob by URL.
 * Protected by HMAC_SECRET env var (timing-safe comparison).
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const provided = req.headers['x-admin-token'] ?? '';
  const expected = process.env.HMAC_SECRET ?? process.env.ADMIN_TOKEN ?? '';
  if (!expected) return res.status(500).json({ error: 'Auth secret not configured.' });
  if (!provided || provided.length !== expected.length) return res.status(401).json({ error: 'Unauthorized' });
  const valid = crypto.timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
  if (!valid) return res.status(401).json({ error: 'Unauthorized' });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url in body.' });

  try {
    await del(url);
    return res.status(200).json({ ok: true, deleted: url });
  } catch (err) {
    console.error('[gallery-delete]', err);
    return res.status(500).json({ error: 'Delete failed.' });
  }
}
