import { list } from '@vercel/blob';

// Vercel Blob addRandomSuffix:true appends exactly 21 alphanumeric chars before the extension
const BLOB_SUFFIX_RE = /-[A-Za-z0-9]{15,25}(\.[^.]+)$/;

function stripSuffix(basename) {
  return basename.replace(BLOB_SUFFIX_RE, '$1');
}

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

    // Filter out the manifest metadata file
    const mediaBlobs = blobs.filter(b => !b.pathname.endsWith('manifest.json'));

    // Deduplicate: group by stem (filename with Vercel random suffix stripped).
    // If the same logical file was uploaded multiple times with different suffixes,
    // only the newest blob survives.
    const stemMap = new Map(); // stem → blob
    for (const b of mediaBlobs) {
      const basename = b.pathname.split('/').pop();
      const stem = stripSuffix(basename);
      const existing = stemMap.get(stem);
      if (!existing || new Date(b.uploadedAt) > new Date(existing.uploadedAt)) {
        stemMap.set(stem, b);
      }
    }

    const files = [...stemMap.values()].map((b, i) => {
      const basename    = b.pathname.split('/').pop();
      const displayName = decodeURIComponent(stripSuffix(basename));
      const ext         = displayName.split('.').pop().toLowerCase();

      return {
        id:         b.url,
        name:       displayName,
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
