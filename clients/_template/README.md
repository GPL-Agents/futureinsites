# Client portals

Each client has a folder under `clients/`, while every client signs in through
the shared `/client-login` page with a workspace name and password. Vercel
middleware protects all `/clients/<workspace>/` pages with a signed,
server-issued session cookie.

The older browser-side password template in this folder is retained only as a
layout reference. Do not use its `passwordHash` configuration for new clients.

## Add a new client

1. Copy an established dashboard folder, such as `clients/trace/`, into a new
   lowercase workspace folder. Copy only the dashboard files and branding
   assets unless the client needs existing presentation-page templates.
2. Update the client `slug`, display `name`, and branding paths in `client.js`.
3. Update the dashboard configuration near the top of `index.html`.
4. Put downloadable files in a `documents/` subfolder. Use lowercase,
   URL-safe filenames.
5. Run `pnpm client:credential <workspace>` to generate a password, the
   workspace-specific Vercel variable name, and its credential value.
6. Add that one new `CLIENT_WORKSPACE_<WORKSPACE>` variable to Vercel for
   Production and Preview. Existing client variables do not need to be read or
   changed.
7. Deploy, then test both the shared login and direct workspace URL in a fresh
   browser session.

## Link a document

In the dashboard's `KEY_DOCS` or `LIBRARY` configuration, point `href` to the
protected client path. For example:

```js
{ title: "Project Brief", href: "/clients/example/documents/project-brief.pdf" }
```

Leave `href: null` until the file is ready. The portal will show a muted
placeholder without creating a broken link.

## Security notes

- Never store plaintext passwords in the repository.
- Do not commit production `CLIENT_WORKSPACE_*` or `CLIENT_AUTH_CONFIG` values.
- Use one `CLIENT_WORKSPACE_*` variable per client. The aggregate
  `CLIENT_AUTH_CONFIG` map remains supported only for existing deployments.
- Client pages and files must stay under their matching workspace path.
- The login endpoint validates redirect paths so one workspace session cannot
  be used to enter another workspace.
- Sessions expire after eight hours by default and can be cleared through
  `/api/client-logout`.
