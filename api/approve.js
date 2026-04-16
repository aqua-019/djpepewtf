import { put, del, list } from '@vercel/blob';

// Vercel Blob addRandomSuffix:true appends 15-25 alphanumeric chars before the extension
const BLOB_SUFFIX_RE = /-[A-Za-z0-9]{15,25}(\.[^.]+)$/;
const stripSuffix = (name) => name.replace(BLOB_SUFFIX_RE, '$1');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Support GET (email link click) and POST (API call)
  let token, url, filename;

  if (req.method === 'GET') {
    token = req.query.token;
    url = req.query.url;
    filename = req.query.filename;
  } else if (req.method === 'POST') {
    token = req.headers['x-admin-token'];
    url = req.body?.url;
    filename = req.body?.filename;
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return res.status(500).send('ADMIN_TOKEN not configured.');
  if (token !== expected) return res.status(403).send('Invalid token.');
  if (!url) return res.status(400).send('Missing submission URL.');

  try {
    // Download the submission file
    const fileRes = await fetch(url);
    if (!fileRes.ok) return res.status(404).send('Submission file not found.');
    const contentType = fileRes.headers.get('content-type') || 'application/octet-stream';
    const fileBuffer = await fileRes.arrayBuffer();

    // Deduplicate: check if a blob with the same stem already exists in gallery/
    const rawName = filename || url.split('/').pop() || 'approved-file';
    const cleanName = rawName.replace(/_[a-zA-Z0-9]{6,8}(\.[^.]+)$/, '$1');
    const { blobs: existing } = await list({ prefix: `gallery/${cleanName}` });
    if (existing.some(b => !b.pathname.endsWith('manifest.json') && stripSuffix(b.pathname.split('/').pop()) === cleanName)) {
      await del(url); // clean up the submission
      if (req.method === 'GET') {
        return res.status(200).send(`
          <!DOCTYPE html><html><head><meta charset="utf-8"><title>Already Exists</title></head>
          <body style="background:#111;color:#eee;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
            <div style="text-align:center;padding:40px;">
              <div style="font-size:48px;margin-bottom:16px;">ℹ️</div>
              <h1 style="color:#52b563;margin:0 0 8px;">Already in Gallery</h1>
              <p style="color:#999;">This file already exists. <a href="https://djpepe.wtf" style="color:#52b563;">View site</a></p>
            </div>
          </body></html>
        `);
      }
      return res.status(409).json({ ok: false, message: 'File already exists in gallery.' });
    }

    // Re-upload to gallery/ prefix with deterministic name (no random suffix)
    const blob = await put(`gallery/${cleanName}`, Buffer.from(fileBuffer), {
      access: 'public',
      contentType,
      addRandomSuffix: false,
    });

    // Delete the original submission
    await del(url);

    // For GET requests (email clicks), return a user-friendly HTML page
    if (req.method === 'GET') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>Approved</title></head>
        <body style="background:#111;color:#eee;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
          <div style="text-align:center;padding:40px;">
            <div style="font-size:48px;margin-bottom:16px;">✅</div>
            <h1 style="color:#52b563;margin:0 0 8px;">Meme Approved</h1>
            <p style="color:#999;">Moved to gallery. <a href="https://djpepe.wtf" style="color:#52b563;">View site</a></p>
          </div>
        </body></html>
      `);
    }

    return res.status(200).json({
      ok: true,
      message: 'Submission approved and moved to gallery.',
      galleryUrl: blob.url,
    });
  } catch (err) {
    console.error('[approve]', err);
    return res.status(500).send('Approval failed.');
  }
}
