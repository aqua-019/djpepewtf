import { put, del } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['x-admin-token'];
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return res.status(500).json({ error: 'ADMIN_TOKEN not configured.' });
  if (token !== expected) return res.status(403).json({ error: 'Invalid admin token.' });

  const { url, filename } = req.body || {};
  if (!url) return res.status(400).json({ error: 'Missing url in request body.' });

  try {
    // Download the submission file
    const fileRes = await fetch(url);
    if (!fileRes.ok) return res.status(404).json({ error: 'Submission file not found.' });
    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    const fileBuffer = await fileRes.arrayBuffer();

    // Re-upload to gallery/ prefix
    const name = filename || url.split('/').pop() || 'approved-file';
    const blob = await put(`gallery/${name}`, Buffer.from(fileBuffer), {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    });

    // Delete the original submission
    await del(url);

    return res.status(200).json({
      ok: true,
      message: 'Submission approved and moved to gallery.',
      galleryUrl: blob.url,
    });
  } catch (err) {
    console.error('[approve]', err);
    return res.status(500).json({ error: 'Approval failed.' });
  }
}
