# Inquiry form: one-time setup

The "Inquire about scheduling" CTA on the homepage now opens a modal that posts to `/api/inquire`. That endpoint forwards the submission to **strategy@futureinsites.com** via Resend.

Until the steps below are done, the function will return a 500 with "Server is not configured to send mail yet." and the form will show that error inline. The modal itself works on the live site immediately.

## 1. Create a Resend account

1. Go to https://resend.com and sign up (free tier covers ~3,000 emails/month).
2. In the Resend dashboard, go to **Domains → Add Domain** and enter `futureinsites.com`.
3. Resend will show you three DNS records to add (one MX, two TXT for DKIM/SPF). Copy them.

## 2. Add the DNS records in GoDaddy

1. Sign in to GoDaddy, open **My Products → DNS** for `futureinsites.com`.
2. Add each record exactly as shown in Resend. Type and host name must match. GoDaddy automatically appends the domain, so a host like `resend._domainkey` should be entered as `resend._domainkey` (not the full FQDN).
3. Save. Back in Resend, click **Verify**. DNS propagation is usually a few minutes; can take up to an hour.

## 3. Create an API key

In Resend → **API Keys → Create API Key**, give it a name (e.g. `futureinsites-vercel`), permission `Sending access`, and copy the `re_…` key.

## 4. Set environment variables in Vercel

In the Vercel dashboard → **FutureInSites project → Settings → Environment Variables**, add the following for **Production** (and Preview if you want it to work on preview deploys):

| Name             | Value                                            |
| ---------------- | ------------------------------------------------ |
| `RESEND_API_KEY` | the `re_…` key from step 3                       |
| `INQUIRY_TO`     | `strategy@futureinsites.com`                     |
| `INQUIRY_FROM`   | `FutureInSites <forms@futureinsites.com>`        |

After adding env vars, **redeploy** (Deployments → latest → ⋯ → Redeploy) so the function picks them up.

> Note: the `INQUIRY_FROM` mailbox doesn't need to exist as a real inbox. Resend only requires that the sending domain (`futureinsites.com`) is verified. Replies go to the submitter's email via the `Reply-To` header, so anyone who clicks Reply in your strategy@ inbox will reply directly to the prospect.

## 5. Smoke test

1. Open https://www.futureinsites.com.
2. Click **Inquire about scheduling**.
3. Fill out the form with your own email and submit.
4. You should see "Thanks, your inquiry is in." in the modal, and an email should arrive at strategy@futureinsites.com within a few seconds.

## Files this touches

- `api/inquire.js`: Vercel serverless function (Node, uses global `fetch`, no npm dependencies).
- `index.html`: adds modal CSS, modal HTML, modal JS, and replaces the mailto CTA with a `<button data-open-inquiry>`.

## Why no `package.json`

The function uses the Resend REST API directly via Node 18's built-in `fetch`. No npm packages are required, so no `package.json` or `node_modules` are needed in the repo. If you later want to use the official `resend` npm SDK or other libraries, add a `package.json` in the repo root and run `npm install`.

## Troubleshooting

- **"Server is not configured to send mail yet."** The `RESEND_API_KEY` env var is missing. Recheck step 4 and redeploy.
- **"Could not send right now."** Check the Vercel function logs (Deployments → latest → Functions → /api/inquire). Most common cause is the `INQUIRY_FROM` address using a domain that isn't verified in Resend.
- **Form submits but email never arrives.** Check your spam folder, then check Resend → Logs to see whether the send actually happened.
- **Bots filling the form.** There's already a honeypot (hidden `website` and `fax` fields). If spam gets past it, add a Cloudflare Turnstile or hCaptcha widget; the function already drops submissions with the honeypot fields filled.
