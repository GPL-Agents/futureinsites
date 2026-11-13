// Vercel Serverless Function: /api/benchmark-creative
// GET  -> lists files uploaded to the Benchmark campaign creative page
// POST -> issues Vercel Blob client-upload tokens (browser uploads straight to Blob)
//
// Uses the existing BLOB_READ_WRITE_TOKEN (same Blob store as /api/apply).
// Password: 'bcmba' by default; set BENCHMARK_UPLOAD_CODE in Vercel to change it.

const { list } = require('@vercel/blob');
const { handleUpload } = require('@vercel/blob/client');

const PREFIX = 'benchmark-creative/';
const PATH_RULE = /^benchmark-creative\/(set-0[1-6]|other\/[a-z0-9-]{1,60})\/[^/]{1,150}$/;
const MAX_BYTES = 100 * 1024 * 1024; // 100 MB
const ALLOWED_TYPES = [
  'image/*', 'video/*', 'audio/*', 'application/pdf', 'text/plain', 'text/html',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip'
];

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const files = [];
      let cursor;
      do {
        const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
        page.blobs.forEach(b => files.push({ pathname: b.pathname, url: b.url, size: b.size, uploadedAt: b.uploadedAt }));
        cursor = page.hasMore ? page.cursor : undefined;
      } while (cursor);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ok: true, files });
    } catch (err) {
      console.error('benchmark-creative: list failed', err);
      return res.status(500).json({ ok: false, error: 'Could not load uploads' });
    }
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
    try {
      const jsonResponse = await handleUpload({
        body,
        request: req,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
          if (!PATH_RULE.test(pathname)) throw new Error('Invalid upload location');
          const code = process.env.BENCHMARK_UPLOAD_CODE || 'bcmba';
          if (code) {
            let sent = '';
            try { sent = JSON.parse(clientPayload || '{}').code || ''; } catch {}
            if (sent !== code) throw new Error('Incorrect password');
          }
          return { allowedContentTypes: ALLOWED_TYPES, maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true };
        },
      });
      return res.status(200).json(jsonResponse);
    } catch (err) {
      console.error('benchmark-creative: upload token failed', err);
      return res.status(400).json({ error: err.message || 'Upload failed' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ ok: false, error: 'Method not allowed' });
};
