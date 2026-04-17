export const config = {};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { url, filename, mimeType, title, context, submitter, dateCreated } = req.body || {};

  if (!url) return res.status(400).json({ error: 'Missing blob URL' });

  const meta = {
    url,
    filename: filename || url.split('/').pop() || 'submission',
    mimeType: mimeType || 'application/octet-stream',
    title: title || '',
    context: context || '',
    submitter: submitter || 'Anonymous',
    dateCreated: dateCreated || '',
  };

  try {
    await Promise.allSettled([
      sendApprovalEmail(meta).catch(err => console.error('[email] failed:', err.message)),
      sendTelegramNotification(meta).catch(err => console.error('[telegram] failed:', err.message)),
    ]);

    return res.status(200).json({
      ok: true,
      message: 'Meme submitted! It will be reviewed before appearing in the gallery.',
    });
  } catch (err) {
    console.error('[submit]', err);
    return res.status(500).json({ error: 'Submission failed. Try again.' });
  }
}

async function sendApprovalEmail({ title, context, submitter, dateCreated, filename, url, mimeType }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const adminToken = process.env.ADMIN_TOKEN || '';
  const siteUrl = process.env.SITE_URL || 'https://djpepe.wtf';

  const approveUrl = `${siteUrl}/api/approve?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}&token=${encodeURIComponent(adminToken)}`;
  const rejectUrl  = `${siteUrl}/api/reject?url=${encodeURIComponent(url)}&token=${encodeURIComponent(adminToken)}`;

  const displayTitle = title || filename;
  const subject = `New Meme Submission: ${displayTitle}`;
  const isImage = ['image/jpeg','image/png','image/gif','image/webp'].includes(mimeType || '');

  const html = `
<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#eee;padding:24px;border-radius:12px;">
  <h2 style="color:#52b563;margin:0 0 16px;">New Meme Submission</h2>
  <table style="width:100%;font-size:14px;border-collapse:collapse;">
    <tr><td style="padding:6px 12px 6px 0;color:#999;">Title</td><td style="padding:6px 0;">${displayTitle}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#999;">From</td><td style="padding:6px 0;">${submitter}</td></tr>
    ${dateCreated ? `<tr><td style="padding:6px 12px 6px 0;color:#999;">Date</td><td style="padding:6px 0;">${dateCreated}</td></tr>` : ''}
    ${context ? `<tr><td style="padding:6px 12px 6px 0;color:#999;">Context</td><td style="padding:6px 0;">${context}</td></tr>` : ''}
    <tr><td style="padding:6px 12px 6px 0;color:#999;">File</td><td style="padding:6px 0;word-break:break-all;font-size:12px;">${filename}</td></tr>
  </table>
  ${isImage
    ? `<div style="margin:20px 0;text-align:center;"><img src="${url}" style="max-width:100%;max-height:400px;border-radius:8px;border:1px solid #333;" alt="${displayTitle}" /></div>`
    : `<div style="margin:20px 0;text-align:center;"><a href="${url}" style="color:#52b563;word-break:break-all;">View File</a></div>`
  }
  <div style="margin:24px 0;text-align:center;">
    <a href="${approveUrl}" style="display:inline-block;padding:12px 32px;background:#52b563;color:#111;font-weight:700;text-decoration:none;border-radius:8px;margin-right:12px;">APPROVE</a>
    <a href="${rejectUrl}" style="display:inline-block;padding:12px 32px;background:#ff4444;color:#fff;font-weight:700;text-decoration:none;border-radius:8px;">REJECT</a>
  </div>
  <p style="color:#666;font-size:11px;margin-top:24px;text-align:center;">DJPEPE.WTF Submission System</p>
</div>
`;

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
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
  const token  = process.env.TELEGRAM_BOT_TOKEN;
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
