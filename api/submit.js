import { put } from '@vercel/blob';

export const config = { api: { bodyParser: false } };

const ALLOWED_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'video/mp4', 'video/webm',
  'audio/mpeg', 'audio/wav', 'audio/ogg',
]);
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-filename, x-filesize, x-title, x-context, x-submitter, x-date-created');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const rawName  = req.headers['x-filename'];
  const rawSize  = req.headers['x-filesize'];
  const title    = decodeURIComponent(req.headers['x-title'] || '');
  const context  = decodeURIComponent(req.headers['x-context'] || '');
  const submitter = decodeURIComponent(req.headers['x-submitter'] || 'Anonymous');
  const dateCreated = req.headers['x-date-created'] || '';
  const mimeType = req.headers['content-type'] || 'application/octet-stream';

  if (!rawName) return res.status(400).json({ error: 'Missing x-filename header' });

  const filename = decodeURIComponent(rawName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const filesize = rawSize ? parseInt(rawSize, 10) : 0;

  if (filesize > MAX_SIZE) {
    return res.status(400).json({ error: 'File too large. Max 25MB for submissions.' });
  }
  if (!ALLOWED_TYPES.has(mimeType) && mimeType !== 'application/octet-stream') {
    return res.status(400).json({ error: 'File type not allowed.' });
  }

  try {
    const blob = await put(`submissions/${filename}`, req, {
      access: 'public',
      contentType: mimeType,
      addRandomSuffix: true,
    });

    // Send approval email (best-effort)
    const meta = { title, context, submitter, dateCreated, filename, url: blob.url };
    await Promise.allSettled([
      sendApprovalEmail(meta).catch(err => console.error('[email] failed:', err.message)),
      sendTelegramNotification(meta).catch(err => console.error('[telegram] failed:', err.message)),
    ]);

    return res.status(200).json({
      ok: true,
      message: 'Meme submitted! It will be reviewed before appearing in the gallery.',
      url: blob.url,
    });
  } catch (err) {
    console.error('[submit]', err);
    return res.status(500).json({ error: 'Submission failed. Try again.' });
  }
}

async function sendApprovalEmail({ title, context, submitter, dateCreated, filename, url }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const adminToken = process.env.ADMIN_TOKEN || '';
  const siteUrl = process.env.SITE_URL || 'https://djpepe.wtf';

  const approveUrl = `${siteUrl}/api/approve?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&token=${encodeURIComponent(adminToken)}`;
  const rejectUrl = `${siteUrl}/api/reject?url=${encodeURIComponent(url)}&token=${encodeURIComponent(adminToken)}`;

  const displayTitle = title || filename;
  const subject = `New Meme Submission: ${displayTitle}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#eee;padding:24px;border-radius:12px;">
      <h2 style="color:#52b563;margin:0 0 16px;">New Meme Submission</h2>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <tr><td style="padding:6px 12px 6px 0;color:#999;">Title</td><td style="padding:6px 0;">${displayTitle}</td></tr>
        <tr><td style="padding:6px 12px 6px 0;color:#999;">From</td><td style="padding:6px 0;">${submitter}</td></tr>
        ${dateCreated ? `<tr><td style="padding:6px 12px 6px 0;color:#999;">Date</td><td style="padding:6px 0;">${dateCreated}</td></tr>` : ''}
        ${context ? `<tr><td style="padding:6px 12px 6px 0;color:#999;">Context</td><td style="padding:6px 0;">${context}</td></tr>` : ''}
      </table>
      <div style="margin:20px 0;text-align:center;">
        <a href="${url}" style="color:#52b563;">View File</a>
      </div>
      <div style="margin:24px 0;text-align:center;">
        <a href="${approveUrl}" style="display:inline-block;padding:12px 32px;background:#52b563;color:#111;font-weight:700;text-decoration:none;border-radius:8px;margin-right:12px;">
          APPROVE
        </a>
        <a href="${rejectUrl}" style="display:inline-block;padding:12px 32px;background:#ff4444;color:#fff;font-weight:700;text-decoration:none;border-radius:8px;">
          REJECT
        </a>
      </div>
      <p style="color:#666;font-size:11px;margin-top:24px;text-align:center;">DJPEPE.WTF Submission System</p>
    </div>
  `;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from: 'DJPEPE.WTF <noreply@djpepe.wtf>',
      to: ['dubsglr@gmail.com'],
      subject,
      html,
    }),
  });
  if (!resp.ok) {
    const errBody = await resp.text().catch(() => '');
    console.error('[email] Resend error:', resp.status, errBody);
  }
}

async function sendTelegramNotification({ title, context, submitter, dateCreated, filename, url }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text = [
    '📥 New DJPEPE.WTF Submission',
    `Title: ${title || filename}`,
    submitter !== 'Anonymous' ? `From: ${submitter}` : null,
    dateCreated ? `Date: ${dateCreated}` : null,
    context ? `Context: ${context}` : null,
    `File: ${url}`,
  ].filter(Boolean).join('\n');

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
  });
}
