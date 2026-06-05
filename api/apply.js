// Vercel Serverless Function: POST /api/apply
// Receives job applications from the careers page modal, stores the resume in
// Vercel Blob, and emails a notification to careers@futureinsites.com via Resend.
//
// Required env vars (set in Vercel → Project → Settings → Environment Variables):
//   BLOB_READ_WRITE_TOKEN   created automatically when you connect a Blob store to the project
//   RESEND_API_KEY          e.g. re_xxxxxxxxxxxxxxxx (same key as /api/inquire)
//   CAREERS_TO              careers@futureinsites.com (optional, this is the default)
//   INQUIRY_FROM            FutureInSites <forms@futureinsites.com> (shared with /api/inquire)

const { put } = require('@vercel/blob');

const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isEmail = (v) => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const MAX_RESUME_BYTES = 3 * 1024 * 1024; // 3 MB, matches the client-side limit
const ALLOWED_EXT = /\.(pdf|doc|docx)$/i;

// keep letters, numbers, dots, dashes; collapse everything else to a dash
const safeFileName = (name) =>
  String(name || 'resume')
    .replace(/[^a-zA-Z0-9.\-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-.]+|[-]+$/g, '')
    .slice(0, 120) || 'resume';

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

  // Honeypot: bots fill hidden fields. If filled, pretend success and drop.
  if (body.website || body.fax) {
    return res.status(200).json({ ok: true });
  }

  const name     = (body.name     || '').toString().trim().slice(0, 200);
  const email    = (body.email    || '').toString().trim().slice(0, 200);
  const linkedin = (body.linkedin || '').toString().trim().slice(0, 400);
  const job      = (body.job      || 'General application').toString().trim().slice(0, 200);
  const resume   = body.resume || {};

  if (!name)               return res.status(400).json({ ok: false, error: 'Name is required.' });
  if (!isEmail(email))     return res.status(400).json({ ok: false, error: 'A valid email is required.' });
  if (!linkedin || !/linkedin\.com\//i.test(linkedin)) {
    return res.status(400).json({ ok: false, error: 'A LinkedIn URL is required.' });
  }

  const filename = safeFileName(resume.filename);
  if (!ALLOWED_EXT.test(filename)) {
    return res.status(400).json({ ok: false, error: 'Resume must be a PDF or Word document (.pdf, .doc, .docx).' });
  }
  if (!resume.data || typeof resume.data !== 'string') {
    return res.status(400).json({ ok: false, error: 'A resume file is required.' });
  }

  let fileBuffer;
  try {
    fileBuffer = Buffer.from(resume.data, 'base64');
  } catch {
    return res.status(400).json({ ok: false, error: 'Could not read the resume file. Please try again.' });
  }
  if (!fileBuffer || fileBuffer.length === 0) {
    return res.status(400).json({ ok: false, error: 'The resume file appears to be empty.' });
  }
  if (fileBuffer.length > MAX_RESUME_BYTES) {
    return res.status(400).json({ ok: false, error: 'Resume must be under 3 MB.' });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('apply: BLOB_READ_WRITE_TOKEN is not set');
    return res.status(500).json({ ok: false, error: 'Server is not configured to accept applications yet. Please email careers@futureinsites.com.' });
  }

  // ---- 1. Store resume in Vercel Blob ----
  const jobSlug = job.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'general';
  const applicantSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'applicant';
  const blobPath = `resumes/${jobSlug}/${applicantSlug}-${filename}`;

  let blob;
  try {
    blob = await put(blobPath, fileBuffer, {
      access: 'public', // URL contains an unguessable random suffix
      contentType: (resume.contentType || 'application/octet-stream').toString().slice(0, 100),
      addRandomSuffix: true,
    });
  } catch (err) {
    console.error('apply: blob upload failed', err);
    return res.status(500).json({ ok: false, error: 'Could not save your resume. Please email careers@futureinsites.com.' });
  }

  // ---- 2. Email notification via Resend (best effort; resume is already saved) ----
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const CAREERS_TO     = process.env.CAREERS_TO   || 'careers@futureinsites.com';
  const INQUIRY_FROM   = process.env.INQUIRY_FROM || 'FutureInSites <forms@futureinsites.com>';

  if (RESEND_API_KEY) {
    const html = `
      <h2 style="margin:0 0 12px;">New application: ${escapeHtml(job)}</h2>
      <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px;">
        <tr><td style="padding:4px 12px 4px 0;color:#64748B;">Name</td><td style="padding:4px 0;"><strong>${escapeHtml(name)}</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748B;">Email</td><td style="padding:4px 0;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748B;">LinkedIn</td><td style="padding:4px 0;"><a href="${escapeHtml(linkedin)}">${escapeHtml(linkedin)}</a></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#64748B;">Resume</td><td style="padding:4px 0;"><a href="${escapeHtml(blob.url)}">${escapeHtml(filename)}</a></td></tr>
      </table>
      <p style="font-family:sans-serif;font-size:12px;color:#64748B;margin-top:16px;">Submitted from the careers page on futureinsites.com. The resume is stored in Vercel Blob; the link above does not expire.</p>
    `;
    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: INQUIRY_FROM,
          to: [CAREERS_TO],
          reply_to: email,
          subject: `Application: ${job} / ${name}`,
          html,
        }),
      });
      if (!resp.ok) {
        console.error('apply: resend error', resp.status, await resp.text());
      }
    } catch (err) {
      console.error('apply: resend request failed', err);
    }
  } else {
    console.error('apply: RESEND_API_KEY not set; application saved to Blob without email notification:', blob.url);
  }

  return res.status(200).json({ ok: true });
};
