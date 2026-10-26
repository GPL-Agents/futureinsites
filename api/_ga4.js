// GA4 Measurement Protocol helper -- server-side events.
//
// Why this exists: a browser event can be lost three ways -- consent denied,
// JavaScript blocked, or a redirect that kills the hit. The form endpoints are
// the source of truth for a lead, so they report the event themselves.
//
// Env vars (Vercel -> Project -> Settings -> Environment Variables):
//   GA4_MP_SECRET        Admin > Data streams > <web stream> > Measurement Protocol API secrets
//   GA4_MEASUREMENT_ID   optional, defaults to the FutureInSites web stream

const MP_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

// Reuse the browser's _ga cookie client id when present so the server event
// joins the same session instead of creating a new user.
function clientIdFrom(req) {
  try {
    const cookie = (req && req.headers && req.headers.cookie) || '';
    const m = /(?:^|;\s*)_ga=GA\d\.\d\.(\d+\.\d+)/.exec(cookie);
    if (m) return m[1];
  } catch (e) { /* fall through */ }
  return `${Date.now()}.${Math.floor(Math.random() * 1000000000)}`;
}

async function sendServerEvent(name, params, clientId) {
  const secret = process.env.GA4_MP_SECRET;
  const measurementId = process.env.GA4_MEASUREMENT_ID || 'G-H8Q5T1KH1T';
  if (!secret) {
    console.warn(`ga4: GA4_MP_SECRET not set, skipping server event "${name}"`);
    return { ok: false, skipped: true };
  }

  const url = `${MP_ENDPOINT}?measurement_id=${encodeURIComponent(measurementId)}`
    + `&api_secret=${encodeURIComponent(secret)}`;
  const payload = {
    client_id: clientId || clientIdFrom(null),
    events: [{
      name,
      params: Object.assign({ engagement_time_msec: 1, server_side: true }, params || {}),
    }],
  };

  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      console.error(`ga4: MP rejected "${name}"`, r.status, detail.slice(0, 300));
    }
    return { ok: r.ok };
  } catch (err) {
    console.error(`ga4: MP send threw "${name}"`, err && err.message);
    return { ok: false };
  }
}

module.exports = { sendServerEvent, clientIdFrom };
