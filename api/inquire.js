// Vercel Serverless Function: POST /api/inquire
// Receives the AI Transformation Session inquiry form and emails it to strategy@futureinsites.com via Resend.
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   RESEND_API_KEY      e.g. re_xxxxxxxxxxxxxxxx
//   INQUIRY_TO          strategy@futureinsites.com
//   INQUIRY_FROM        FutureInSites <forms@futureinsites.com>   (sender must be on a verified Resend domain)

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

module.exports = async function handler(req, res) {
  // CORS guard: same-origin only; tighten by setting an explicit origin if you want.
  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST');
    return res.status(204).end();
  }
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  // Honeypot: bots fill hidden fields. If filled, pretend success and drop.
  if (body.website || body.fax) {
    return res.status(200).json({ ok: true });
  }

  const name    = (body.name    || '').toString().trim().slice(0, 200);
  const email   = (body.email   || '').toString().trim().slice(0, 200);
  const company = (body.company || '').toString().trim().slice(0, 200);
  const role    = (body.role    || '').toString().trim().slice(0, 200);
  const phone   = (body.phone   || '').toString().trim().slice(0, 80);
  const message = (body.message || '').toString().trim().slice(0, 4000);

  if (!name)         return res.status(400).json({ ok: false, error: 'Name is required.' });
  if (!isEmail(email)) return res.status(400).json({ ok: false, error: 'A valid email is required.' });

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const INQUIRY_TO     = process.env.INQUIRY_TO   || 'strategy@futureinsites.com';
  const INQUIRY_FROM   = process.env.INQUIRY_FROM || 'FutureInSites <forms@futureinsites.com>';

  if (!RESEND_API_KEY) {
    console.error('inquire: RESEND_API_KEY is not set');
    return res.status(500).json({ ok: false, error: 'Server is not configured to send mail yet.' });
  }

  const subject = `New AI Transformation Session inquiry from ${name}${company ? ` (${company})` : ''}`;
  const lines = [
    ['Name',    name],
    ['Email',   email],
    ['Company', company || '(not provided)'],
    ['Role',    role    || '(not provided)'],
    ['Phone',   phone   || '(not provided)'],
  ];

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#140F0F;font-size:14px;line-height:1.55;">
      <h2 style="margin:0 0 12px 0;font-size:18px;">New AI Transformation Session inquiry</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px 0;">
        ${lines.map(([k, v]) => `
          <tr>
            <td style="padding:4px 14px 4px 0;color:#64748B;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;">${k}</td>
            <td style="padding:4px 0;color:#140F0F;">${escapeHtml(v)}</td>
          </tr>
        `).join('')}
      </table>
      <div style="border-top:1px solid #E4E7EE;padding-top:12px;">
        <div style="color:#64748B;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;margin-bottom:6px;">Message</div>
        <div style="white-space:pre-wrap;color:#140F0F;">${escapeHtml(message) || '<span style="color:#94a3b8;">(none)</span>'}</div>
      </div>
      <p style="margin-top:18px;color:#94a3b8;font-size:12px;">Submitted via the inquiry form on futureinsites.com.</p>
    </div>
  `;

  const text = [
    `New AI Transformation Session inquiry`,
    ``,
    ...lines.map(([k, v]) => `${k}: ${v}`),
    ``,
    `Message:`,
    message || '(none)',
    ``,
    `Submitted via the inquiry form on futureinsites.com.`,
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: INQUIRY_FROM,
        to: [INQUIRY_TO],
        reply_to: email,
        subject,
        html,
        text,
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('inquire: Resend returned non-OK', r.status, detail);
      return res.status(502).json({ ok: false, error: 'Could not send right now. Please email strategy@futureinsites.com directly.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('inquire: send threw', err);
    return res.status(500).json({ ok: false, error: 'Could not send right now. Please email strategy@futureinsites.com directly.' });
  }
}
