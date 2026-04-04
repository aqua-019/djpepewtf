import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET')    return res.status(405).json({ error: 'Method not allowed' });

  try {
    const limit  = Math.min(parseInt(req.query.limit) || 500, 1000);
    const cursor = req.query.cursor || undefined;

    const { blobs, hasMore, cursor: nextCursor } = await list({
      prefix: 'gallery/',
      limit,
      cursor,
    });

    const files = blobs.map((b, i) => {
      const ext      = b.pathname.split('.').pop().toLowerCase();
      const basename = b.pathname.split('/').pop();

      return {
        id:         b.url,
        name:       decodeURIComponent(basename),
        type:       ext,
        url:        b.url,
        size:       b.size,
        uploadedAt: b.uploadedAt,
        bg:         `g${(i % 6) + 1}`,
        icon:       iconForType(ext),
        category:   categoryForType(ext),
        isNew:      false,
      };
    });

    // Newest first
    files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    return res.status(200).json({
      files,
      hasMore: hasMore || false,
      cursor: nextCursor || null,
    });
  } catch (err) {
    console.error('[gallery]', err);
    return res.status(500).json({ error: 'Could not load gallery.', files: [] });
  }
}

function categoryForType(ext) {
  const IMAGE_EXTS = new Set(['jpg','jpeg','png','tiff','bmp','webp','avif','heic','heif']);
  const VIDEO_EXTS = new Set(['mp4','webm','mov','avi','ogv']);
  const AUDIO_EXTS = new Set(['mp3','wav','ogg','flac','aac','m4a']);
  if (ext === 'gif') return 'gif';
  if (ext === 'svg') return 'image';
  if (IMAGE_EXTS.has(ext)) return 'image';
  if (VIDEO_EXTS.has(ext)) return 'video';
  if (AUDIO_EXTS.has(ext)) return 'audio';
  return 'other';
}

function iconForType(ext) {
  const map = {
    gif: 'gif', mp4: 'video', webm: 'video', mov: 'video', avi: 'video', ogv: 'video',
    mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio', aac: 'audio', m4a: 'audio',
    jpg: 'image', jpeg: 'image', png: 'image', tiff: 'image', bmp: 'image',
    svg: 'vector', webp: 'image', avif: 'image', heic: 'image', heif: 'image',
  };
  return map[ext] || 'file';
}
