# Client Presentations

Each client gets their own folder under `clients/` with a private, password-gated
page. They visit a unique URL, enter an access code, and see their presentation
as a webpage with optional PDF / PowerPoint download buttons.

## Add a new client (about 2 minutes)

1. **Copy this `_template` folder** and rename it to the client's slug.
   Example: `clients/_template/` -> `clients/trace/`
   The slug should be lowercase, no spaces (it becomes part of the URL).

2. **Drop in the presentation files** inside the new folder:
   - `presentation.pdf` (for the on-page viewer and PDF download)
   - `presentation.pptx` (optional, for the PowerPoint download)
   You can name them anything; just match the names in step 4.

3. **Generate an access code hash.** Open `clients/password-tool.html` in your
   browser. Enter the slug (e.g. `trace`) and the access code you want to give
   the client (e.g. `Roadmap-2026`). Click Generate and copy the hash.

4. **Edit the new folder's `index.html`** and fill in the CONFIG block near the
   top of the file:
   - `slug` - same slug you used in the password tool (e.g. `"trace"`)
   - `client` - client name shown on the page
   - `title` / `subtitle` - presentation heading
   - `passwordHash` - paste the hash from step 3
   - `viewerFile` - the PDF to show on the page, or `null` to hide the viewer
   - `pdfFile` - PDF download button filename, or `null` to hide it
   - `pptFile` - PowerPoint download filename, or `null` to hide it

5. **Commit and push** in GitHub Desktop. Vercel deploys automatically.

6. **Send the client** their link and access code, for example:
   - URL: `https://futureinsites.com/clients/trace/`
   - Access code: `Roadmap-2026`

## Try the demo

`clients/sample/` is a working example. Access code: **demo2026**.
Live at `https://futureinsites.com/clients/sample/` after deploy.

## How the password works (and its limit)

The access code is never stored in the site. Only a salted SHA-256 hash is,
so someone reading the page source cannot see the code itself. This is a
courtesy gate: it keeps the presentation private from anyone without the link
and code, and is great for normal client sharing. It is not bank-grade though.
Because the site is static, a determined technical person who has the page URL
could find the underlying PDF path in the source. If you ever need a deck that
must be impossible to reach without authentication, ask for the server-side
version (uses a Vercel function instead of in-page JavaScript).

## Tips

- Folders starting with `_` (like `_template`) are just there for you; clients
  never get a link to them.
- `clients/index.html` is a generic "private area" page, so `/clients/` never
  shows a file listing.
- Each client folder is fully self-contained: delete the folder to remove a
  client's access.
