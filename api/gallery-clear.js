import { list, del } from '@vercel/blob';

/**
 * POST /api/gallery-clear
 *
 * Deletes all blobs under the gallery/ prefix.
 * Protected by a simple secret token passed as x-admin-token header.
 * Set ADMIN_TOKEN in your Vercel environment variables.
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Simple token auth
  const token = req.headers['x-admin-token'];
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return res.status(500).json({ error: 'ADMIN_TOKEN not configured in environment.' });
  if (token !== expected) return res.status(403).json({ error: 'Invalid admin token.' });

  try {
    let deleted = 0;
    let cursor = undefined;

    // Delete in batches
    do {
      const { blobs, hasMore, cursor: next } = await list({
        prefix: 'gallery/',
        limit: 100,
        cursor,
      });

      if (blobs.length > 0) {
        await del(blobs.map(b => b.url));
        deleted += blobs.length;
      }

      cursor = hasMore ? next : undefined;
    } while (cursor);

    return res.status(200).json({ ok: true, deleted });
  } catch (err) {
    console.error('[gallery-clear]', err);
    return res.status(500).json({ error: 'Failed to clear gallery.' });
  }
}
