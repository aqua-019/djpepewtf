import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    // List everything under gallery/ prefix
    const { blobs } = await list({ prefix: 'gallery/' });

    // Normalise to what the frontend expects
    const files = blobs.map((b, i) => {
      const ext      = b.pathname.split('.').pop().toLowerCase();
      const basename = b.pathname.split('/').pop();

      return {
        id:         b.url,                          // stable unique key = CDN URL
        name:       decodeURIComponent(basename),
        type:       ext,
        url:        b.url,
        size:       b.size,
        uploadedAt: b.uploadedAt,
        // Derive thumb bg class deterministically from index
        bg:         `g${(i % 6) + 1}`,
        icon:       iconForType(ext),
        // Social stats live in localStorage keyed by URL — seeded at 0
        upvotes:    0,
        comments:   0,
        views:      0,
        isNew:      false,
      };
    });

    // Newest first
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return res.status(200).json({ files });
  } catch (err) {
    console.error('[gallery]', err);
    return res.status(500).json({ error: 'Could not load gallery.', files: [] });
  }
}

function iconForType(ext) {
  const map = {
    gif: '🎞', mp4: '📼', webm: '📼',
    mp3: '🎵', wav: '🎵',
    jpg: '🐸', jpeg: '🐸', png: '🎴',
    svg: '✏️', webp: '🖼',
  };
  return map[ext] || '📁';
}
