// Vercel Serverless Function: /api/proxy-bulk
// Accepts { items: [Opportunity, ...] } and writes each one to the Apps Script
// in turn (the Apps Script has no native bulk path, so we fan out single POSTs).
//
// Required environment variables (same as /api/proxy):
//   PROXY_TOKEN, APPS_SCRIPT_URL, APPS_SCRIPT_KEY

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

    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, error: "Method not allowed" });
    }

    let payload = req.body;
    if (typeof payload === "string") payload = JSON.parse(payload);

    const items =
      payload && typeof payload === "object" && Array.isArray(payload.items)
        ? payload.items
        : null;

    if (!items || items.length === 0) {
      return res.status(400).json({ ok: false, error: "No items provided" });
    }

    const results = [];

    for (let i = 0; i < items.length; i++) {
      let record = items[i];

      // Unwrap GPT Action wrappers.
      if (record && typeof record === "object") {
        if (!record.id && record.opportunity) record = record.opportunity;
        if (!record.id && record.record) record = record.record;
      }
      if (record?.id != null) record.id = String(record.id);

      const url = new URL(scriptUrl);
      url.searchParams.set("api_key", scriptKey);
      const upstream = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(record),
      });
      const text = await upstream.text();

      results.push({
        index: i,
        id: record?.id,
        ok: upstream.ok,
        status: upstream.status,
        upstreamBody: text,
      });
    }

    return res.status(200).json({
      ok: true,
      mode: "bulk",
      total: results.length,
      okCount: results.filter((r) => r.ok).length,
      results,
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: "Bulk proxy crashed", message: e?.message ?? String(e) });
  }
}
