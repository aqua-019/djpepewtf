import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = req.headers['x-admin-token'];
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return res.status(500).json({ error: 'ADMIN_TOKEN not configured.' });
  if (token !== expected) return res.status(403).json({ error: 'Invalid admin token.' });

  try {
    const { blobs } = await list({ prefix: 'submissions/', limit: 200 });

    const submissions = blobs.map(b => {
      const basename = b.pathname.split('/').pop();
      const ext = basename.split('.').pop().toLowerCase();
      return {
        url: b.url,
        name: decodeURIComponent(basename),
        type: ext,
        size: b.size,
        uploadedAt: b.uploadedAt,
      };
    });

    submissions.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return res.status(200).json({ submissions, count: submissions.length });
  } catch (err) {
    console.error('[submissions]', err);
    return res.status(500).json({ error: 'Could not list submissions.' });
  }
}
