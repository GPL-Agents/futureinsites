This folder is the MCP server you deploy to Vercel. It exposes 4 tools and forwards
each call to your Google Apps Script.

Folder layout in your repo (route.ts must sit at this exact path):
  package.json
  next.config.mjs
  tsconfig.json
  app/api/[transport]/route.ts

route.ts is provided flat here for easy download. When you put it in your repo, place
it at app/api/[transport]/route.ts (a folder literally named [transport], brackets
included).

Deploy: push this folder to a GitHub repo, import it into Vercel (Next.js auto-detected),
set the two environment variables APPS_SCRIPT_URL and APPS_SCRIPT_KEY, then deploy.
Your MCP endpoint is https://YOUR-PROJECT.vercel.app/api/mcp

The route file already includes the required `createMcpHandler(fn, {}, { basePath: "/api" })`
setting — without it the endpoint returns 404.
