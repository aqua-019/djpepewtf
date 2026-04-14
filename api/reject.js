import { del } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // Support GET (email link click) and POST (API call)
  let token, url;

  if (req.method === 'GET') {
    token = req.query.token;
    url = req.query.url;
  } else if (req.method === 'POST') {
    token = req.headers['x-admin-token'];
    url = req.body?.url;
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return res.status(500).send('ADMIN_TOKEN not configured.');
  if (token !== expected) return res.status(403).send('Invalid token.');
  if (!url) return res.status(400).send('Missing submission URL.');

  try {
    await del(url);

    // For GET requests (email clicks), return a user-friendly HTML page
    if (req.method === 'GET') {
      return res.status(200).send(`
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><title>Rejected</title></head>
        <body style="background:#111;color:#eee;font-family:system-ui;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
          <div style="text-align:center;padding:40px;">
            <div style="font-size:48px;margin-bottom:16px;">❌</div>
            <h1 style="color:#ff4444;margin:0 0 8px;">Meme Rejected</h1>
            <p style="color:#999;">Submission deleted. <a href="https://djpepe.wtf" style="color:#52b563;">Back to site</a></p>
          </div>
        </body></html>
      `);
    }

    return res.status(200).json({ ok: true, message: 'Submission rejected and deleted.' });
  } catch (err) {
    console.error('[reject]', err);
    return res.status(500).send('Rejection failed.');
  }
}
