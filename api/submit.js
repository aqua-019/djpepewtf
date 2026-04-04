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

    // Send notifications (best-effort, don't block response)
    const meta = { title, context, submitter, dateCreated, filename, url: blob.url };
    sendTelegramNotification(meta).catch(() => {});

    return res.status(200).json({
      ok: true,
      message: 'Submission received. It will be reviewed before appearing in the gallery.',
      url: blob.url,
    });
  } catch (err) {
    console.error('[submit]', err);
    return res.status(500).json({ error: 'Submission failed. Try again.' });
  }
}

async function sendTelegramNotification({ title, context, submitter, dateCreated, filename, url }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const text = [
    `📥 New DJPEPE.WTF Submission`,
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
