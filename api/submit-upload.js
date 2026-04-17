import { handleUpload } from '@vercel/blob/client';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const body = await new Promise((resolve) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(JSON.parse(data || '{}')));
  });

  const response = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async (pathname) => ({
      allowedContentTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'image/heic', 'image/heif', 'image/svg+xml',
        'video/mp4', 'video/webm', 'video/quicktime',
        'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac',
      ],
      maximumSizeInBytes: 100 * 1024 * 1024,
      addRandomSuffix: true,
    }),
    onUploadCompleted: async ({ blob }) => {
      console.log('[submit-upload] completed:', blob.url);
    },
  });

  return res.status(200).json(response);
}
