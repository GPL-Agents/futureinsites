// Vercel Serverless Function: /api/proxy
// Job Search Command Center proxy. Sits between your custom GPT and your Google
// Apps Script web app so the Apps Script key is never exposed to the GPT.
//
// Required environment variables (set in Vercel -> Project -> Settings -> Environment Variables):
//   PROXY_TOKEN       the API key your GPT sends in the "x-api-key" header
//   APPS_SCRIPT_URL   your Apps Script web app /exec URL
//   APPS_SCRIPT_KEY   the API_KEY script property you set on the Apps Script

export default async function handler(req, res) {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!process.env.PROXY_TOKEN || apiKey !== process.env.PROXY_TOKEN) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const scriptUrl = process.env.APPS_SCRIPT_URL;
    const scriptKey = process.env.APPS_SCRIPT_KEY;
    if (!scriptUrl || !scriptKey) {
      return res.status(500).json({ ok: false, error: "Missing env: APPS_SCRIPT_URL or APPS_SCRIPT_KEY" });
    }

    // GET = getOpportunities: forward query params through to the Apps Script.
    if (req.method === "GET") {
      const url = new URL(scriptUrl);
      url.searchParams.set("api_key", scriptKey);
      for (const [k, v] of Object.entries(req.query || {})) {
        if (v === undefined) continue;
        if (k === "api_key" || k === "key") continue; // never let the client override the upstream key
        url.searchParams.set(k, String(v));
      }
      const upstream = await fetch(url.toString(), { method: "GET" });
      const data = await upstream.json();
      return res.status(upstream.ok ? 200 : 502).json(data);
    }

    // POST = upsert a single opportunity.
    if (req.method === "POST") {
      let payload = req.body;
      if (typeof payload === "string") payload = JSON.parse(payload);

      // Unwrap GPT Action wrappers so the Apps Script receives a flat record.
      if (payload && typeof payload === "object") {
        if (!payload.id && payload.opportunity) payload = payload.opportunity;
        if (!payload.id && payload.record) payload = payload.record;
      }
      if (payload?.id != null) payload.id = String(payload.id);

      const url = new URL(scriptUrl);
      url.searchParams.set("api_key", scriptKey);
      const upstream = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await upstream.text();
      return res.status(upstream.ok ? 200 : 502).json({
        ok: upstream.ok,
        upstreamStatus: upstream.status,
        upstreamBody: text,
      });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Proxy crashed", message: e?.message ?? String(e) });
  }
}
