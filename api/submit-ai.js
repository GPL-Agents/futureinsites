// Vercel Serverless Function: POST /api/submit-ai
// Receives an AI Landscape vendor submission and emails it to submissions@futureinsites.com via Resend.
//
// Required env vars (set in Vercel -> Project -> Settings -> Environment Variables):
//   RESEND_API_KEY        e.g. re_xxxxxxxxxxxxxxxx (same key used by /api/inquire)
//   SUBMISSIONS_TO        submissions@futureinsites.com
//   INQUIRY_FROM          FutureInSites <forms@futureinsites.com>   (sender; reuses the verified domain)

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isUrl = (v) => typeof v === 'string' && /^https?:\/\/[^\s.]+\.[^\s]+/i.test(v.trim());

module.exports = async function handler(req, res) {
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

  // Honeypot: drop silently if filled
  if (body.website_hp || body.fax) {
    return res.status(200).json({ ok: true });
  }

  const email       = (body.email       || '').toString().trim().slice(0, 200);
  const toolName    = (body.toolName    || '').toString().trim().slice(0, 200);
  const url         = (body.url         || '').toString().trim().slice(0, 500);
  const category    = (body.category    || '').toString().trim().slice(0, 200);
  const description = (body.description || '').toString().trim().slice(0, 4000);

  if (!isEmail(email))   return res.status(400).json({ ok: false, error: 'A valid email is required.' });
  if (!toolName)         return res.status(400).json({ ok: false, error: 'AI tool/company name is required.' });
  if (!isUrl(url))       return res.status(400).json({ ok: false, error: 'A valid website URL is required (include https://).' });

  const RESEND_API_KEY  = process.env.RESEND_API_KEY;
  const SUBMISSIONS_TO  = process.env.SUBMISSIONS_TO || 'submissions@futureinsites.com';
  const SUBMIT_FROM     = process.env.INQUIRY_FROM   || 'FutureInSites <forms@futureinsites.com>';

  if (!RESEND_API_KEY) {
    console.error('submit-ai: RESEND_API_KEY is not set');
    return res.status(500).json({ ok: false, error: 'Server is not configured to send mail yet.' });
  }

  const subject = `AI Landscape submission: ${toolName}`;
  const lines = [
    ['Tool / Company', toolName],
    ['Website',        url],
    ['Category',       category || '(not selected)'],
    ['Submitter',      email],
  ];

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;color:#140F0F;font-size:14px;line-height:1.55;">
      <h2 style="margin:0 0 12px 0;font-size:18px;">New AI Landscape submission</h2>
      <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 16px 0;">
        ${lines.map(([k, v]) => `
          <tr>
            <td style="padding:4px 14px 4px 0;color:#64748B;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;">${k}</td>
            <td style="padding:4px 0;color:#140F0F;">${escapeHtml(v)}</td>
          </tr>
        `).join('')}
      </table>
      <div style="border-top:1px solid #E4E7EE;padding-top:12px;">
        <div style="color:#64748B;font-weight:600;text-transform:uppercase;font-size:11px;letter-spacing:0.06em;margin-bottom:6px;">Why include it / What makes it unique</div>
        <div style="white-space:pre-wrap;color:#140F0F;">${escapeHtml(description) || '<span style="color:#94a3b8;">(none provided)</span>'}</div>
      </div>
      <p style="margin-top:18px;color:#94a3b8;font-size:12px;">Submitted via the AI Vendor Landscape page on futureinsites.com.</p>
    </div>
  `;

  const text = [
    `New AI Landscape submission`,
    ``,
    ...lines.map(([k, v]) => `${k}: ${v}`),
    ``,
    `Why include it / What makes it unique:`,
    description || '(none provided)',
    ``,
    `Submitted via the AI Vendor Landscape page on futureinsites.com.`,
  ].join('\n');

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: SUBMIT_FROM,
        to: [SUBMISSIONS_TO],
        reply_to: email,
        subject,
        html,
        text,
      }),
    });

    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error('submit-ai: Resend returned non-OK', r.status, detail);
      return res.status(502).json({ ok: false, error: 'Could not send right now. Please try again, or email submissions@futureinsites.com directly.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('submit-ai: send threw', err);
    return res.status(500).json({ ok: false, error: 'Could not send right now. Please try again, or email submissions@futureinsites.com directly.' });
  }
};
