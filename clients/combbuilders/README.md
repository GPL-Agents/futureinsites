# ComBuilders client portal

This folder is the protected ComBuilders workspace served at
`/clients/combbuilders/portal`. The shorter `/clients/combbuilders/` address
redirects there after authentication. The shared sign-in page accepts
`ComBuilders` or `combbuilders` as the workspace name because workspace
matching is case-insensitive.

## Add documents

1. Put client files in `documents/` using lowercase, URL-safe filenames.
2. Edit `KEY_DOCS` or `LIBRARY` near the top of `portal.html`.
3. Set the item's `href` to `/clients/combbuilders/documents/filename.ext`.
4. Leave `href: null` for documents that are not ready. They display as
   unavailable placeholders in the portal.

## Update engagement details

Edit the `ENGAGEMENT`, `DELIVERABLES`, `KEY_DOCS`, and `LIBRARY` blocks near
the top of `portal.html`. No layout changes are needed for routine updates.

## Replace the temporary branding

Replace `ComBuildersFavicon.svg` and `ComBuildersWordmark.svg` with official
client assets, or update their paths in `client.js` if the filenames change.

## Authentication

Authentication is managed on the server. New clients use an independent
`CLIENT_WORKSPACE_<WORKSPACE>` Vercel environment variable, so adding or
rotating one client does not affect any other workspace. The aggregate
`CLIENT_AUTH_CONFIG` map remains supported for compatibility. Never place a
plaintext password or production credential value in this folder.
