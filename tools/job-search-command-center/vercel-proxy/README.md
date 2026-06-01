# Job Search Command Center proxy (Vercel)

A tiny serverless proxy that sits between your custom GPT and your Google Apps
Script web app. It keeps the Apps Script key out of the GPT and gives the GPT a
clean, stable API to call.

```
GPT  --x-api-key (PROXY_TOKEN)-->  this proxy  --?api_key (APPS_SCRIPT_KEY)-->  Apps Script  -->  Google Sheet
```

## Files

- `api/proxy.js` — `GET` reads opportunities, `POST` upserts one opportunity.
- `api/proxy-bulk.js` — `POST` upserts many opportunities (`{ "items": [ ... ] }`).
- `package.json` — marks the project as ES modules.

## Deploy

1. Put this folder in its own GitHub repo (or import the folder directly into Vercel).
2. In Vercel, create a new project from the repo. No build step is needed.
3. Add three Environment Variables (Production), then redeploy:

| Name              | Value                                                            |
| ----------------- | ---------------------------------------------------------------- |
| `PROXY_TOKEN`     | A long random string you invent. Your GPT sends this as `x-api-key`. |
| `APPS_SCRIPT_URL` | Your Apps Script web app URL (ends in `/exec`).                  |
| `APPS_SCRIPT_KEY` | The `API_KEY` script property you set on the Apps Script.        |

4. Your endpoints are now:
   - `GET  https://YOUR-PROJECT.vercel.app/api/proxy`
   - `POST https://YOUR-PROJECT.vercel.app/api/proxy`
   - `POST https://YOUR-PROJECT.vercel.app/api/proxy-bulk`

## Test

```bash
curl -H "x-api-key: YOUR_PROXY_TOKEN" "https://YOUR-PROJECT.vercel.app/api/proxy?limit=1"
```

A `200` with `{ "opportunities": [...] }` means the whole chain is wired correctly.
A `401` means the `x-api-key` does not match `PROXY_TOKEN`; a `502` means the proxy
reached the Apps Script but the script returned an error (check `APPS_SCRIPT_URL`
and `APPS_SCRIPT_KEY`).
