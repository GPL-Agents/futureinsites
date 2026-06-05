# Careers application form: one-time setup

The Apply buttons on careers.html open a modal (name, email, LinkedIn URL, resume upload) that posts to `/api/apply`. The endpoint:

1. Saves the resume to **Vercel Blob** (permanent storage, link never expires)
2. Emails a notification with all applicant details and a resume link to **careers@futureinsites.com** via Resend

Resumes are capped at 3 MB, PDF or Word only. Until the steps below are done, the form shows "Server is not configured to accept applications yet."

## 1. Connect a Blob store (required)

1. Vercel dashboard → **FutureInSites project → Storage** tab → **Create Database → Blob**.
2. Name it (e.g. `fis-resumes`) and click **Create**, then **Connect** it to the project for Production (and Preview if desired).
3. That's it. Connecting the store automatically adds the `BLOB_READ_WRITE_TOKEN` environment variable. Redeploy once so the function picks it up.

The free Hobby tier includes 1 GB of Blob storage, which is roughly 1,000+ resumes.

## 2. Email notification (uses the same Resend setup as the inquiry form)

If you have already completed `INQUIRE_SETUP.md` (Resend account, domain verification, `RESEND_API_KEY` in Vercel), notifications work immediately. The function reuses:

| Name             | Value                                          | Required? |
| ---------------- | ---------------------------------------------- | --------- |
| `RESEND_API_KEY` | the `re_...` key from Resend                   | for email notifications |
| `INQUIRY_FROM`   | `FutureInSites <forms@futureinsites.com>`      | optional, this is the default |
| `CAREERS_TO`     | `careers@futureinsites.com`                    | optional, this is the default |

`careers@futureinsites.com` already routes to you via the Workspace catch-all, so nothing to provision there.

If Resend is not configured yet, applications are **still saved to Blob**; you just won't get the email. Resume files are listed in Vercel dashboard → Storage → your Blob store, organized as `resumes/<job>/<applicant>-<filename>`.

## Where resumes live

- **Vercel dashboard → Storage → Blob store**: browse and download every resume, grouped by job.
- **Notification email**: each one contains a direct link to the stored resume.
- Blob URLs are public but contain a long random suffix, so they are not guessable. Do not post them anywhere public.

## Testing after setup

1. Open futureinsites.com/careers.html, click any Apply button.
2. Submit with a small test PDF.
3. Confirm the file appears under Storage → Blob → `resumes/...` and the email arrives at careers@futureinsites.com.
