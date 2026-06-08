# Build your own Job Search Command Center on Claude

A free, build-your-own job-search agent that triages, scores, tracks, and plans your
search against a single source of truth (a Google Sheet you own). This is the Claude
version of the FutureInSites Job Search Command Center. Everything runs in your own
accounts; your data stays in your own Sheet.

## What you are building

```
Claude (Cowork panel OR a Chat Project)
   -> "Job Search Command Center" connector
      -> MCP server on Vercel
         -> Google Apps Script
            -> your Google Sheet
```

Five modes: TRIAGE (score + save a role), TRACK (update a role), DRAFT (cover
letter / follow-up / LinkedIn), DAILY PLAN, REFRESH ALL.

## Read this first: what Claude can and cannot do here

A custom GPT in ChatGPT gives you clickable starter buttons on the subscription model
for free. Claude does not have an equivalent no-code button UI layered over its
subscription chat. So plan on one of two final surfaces:

- Claude Chat (a Project): works anywhere including mobile, full-quality model, free
  on your subscription. You drive it by typing commands (a cheat-sheet is included).
  No buttons.
- Cowork (a pinned panel): gives you a real dashboard UI with buttons, but it is on
  one desktop machine, and only the model-free actions (live counts, Daily Plan,
  Refresh, Track) are buttons. Triage and Draft need the model, so you type those in
  the Cowork chat. (A clickable Triage button is only possible if you pay for a metered
  API key, which this guide does not require.)

Pick whichever fits. The backend below is identical for both.

## Prerequisites
- A Google account (for the Sheet + Apps Script).
- A GitHub account and a Vercel account (free Hobby tier is fine) for the MCP server.
- Claude Pro or Max (custom connectors require a paid plan).

------------------------------------------------------------------------
# PART 1 — The backend (both options need this)

## Step 1 — Create the Google Sheet
1. Create a new Google Sheet. Rename the first tab to exactly:
   `Job Search Command Center - Opportunities`
2. Open `sheet-headers.txt`, copy the single tab-separated line, and paste it into
   cell A1 so it fills row 1 across columns A-Z (26 columns). Columns are matched by
   name, so keep them exactly as written.

## Step 2 — Deploy the Apps Script
1. In the Sheet: Extensions -> Apps Script. Delete any starter code, paste all of
   `apps-script.gs`, and Save.
2. Left sidebar -> Project Settings (gear) -> Script Properties -> Add property:
   name `API_KEY`, value = a long random string you invent. Save it; keep it handy.
3. Deploy -> New deployment. Click the gear and pick type **Web app**.
   Execute as: **Me**.  Who has access: **Anyone**.  Click Deploy.
4. Authorize when prompted. Because it is your own unverified script, click Advanced,
   then "Go to [project] (unsafe)", then Allow. This is normal.
5. Copy the Web app URL (it ends in `/exec`). That URL plus your API_KEY are what the
   server needs next.

GOTCHAS
- Deploy while signed into the SAME Google account that owns the Sheet.
- Changing the API_KEY property later does NOT require a redeploy; the live script
  reads it at runtime.
- On a Google Workspace, an admin may block "Anyone" access or web-app deployment; if
  step 3 won't let you set "Anyone", that is the cause.

## Step 3 — Put the MCP server on GitHub (do this fully BEFORE Vercel)
The `mcp-server` folder is a small Next.js app. Get it onto GitHub:
1. Create a new repository on GitHub (any name, e.g. `jscc-mcp`). Public or private.
2. Upload the files so that `package.json` is at the repo root and `route.ts` sits at
   `app/api/[transport]/route.ts` (a folder literally named `[transport]`, brackets
   included).

GOTCHAS
- GitHub's "choose files" button only takes loose files. To create the nested folders,
  use "Create new file" and type the full path `app/api/[transport]/route.ts`.
- Verify after upload that `app/api/[transport]/route.ts` exists. If it is missing,
  the server has no endpoint.
- Do not leave stray copies of files at the repo root.

## Step 4 — Deploy to Vercel
1. In Vercel: Add New -> Project -> Import your repo. It auto-detects Next.js; leave
   build settings alone.
2. BEFORE deploying, expand Environment Variables and add two (this step is required):
   - `APPS_SCRIPT_URL` = your Apps Script `/exec` URL from Step 2.
   - `APPS_SCRIPT_KEY` = the API_KEY value you set in Step 2.
3. Click Deploy. When it finishes, your MCP endpoint is your project URL plus
   `/api/mcp`, e.g. `https://your-project.vercel.app/api/mcp`.

GOTCHAS
- The route file already contains `createMcpHandler(fn, {}, { basePath: "/api" })`.
  That line is required; without it the endpoint returns 404.
- If you ever test the Apps Script with curl: it 302-redirects, so use
  `curl -L --data '...'`. Do NOT use `curl -X POST` (it forces POST across the
  redirect and returns 405).

## Step 5 — Add the connector in Claude
1. Claude -> Customize -> Connectors -> the `+` -> Add custom connector.
2. Paste your `/api/mcp` URL. Leave OAuth blank. Save.
3. Open the connector and set its tools to Always allow.
4. Test: in any chat, ask "read my job pipeline". It should return an empty list (or
   your rows). That confirms the whole chain works.

## Step 6 — Give it your background
1. Open `project-instructions-template.txt`. It is the agent's brain. The profile
   section is a placeholder.
2. Either fill `candidate-profile-template.txt` yourself and paste it in, or paste the
   whole instructions in and type "setup" so the agent builds your profile from your
   resume, then paste the result back into the instructions in place of the placeholder.

------------------------------------------------------------------------
# PART 2 — Choose your surface

## Option A — Cowork (a dashboard UI, one machine) [DEFAULT]
1. In Cowork, add `cowork-control-panel-template.html` as a pinned live artifact.
2. Replace every `YOUR_CONNECTOR_ID` in that file with your connector's id. You can see
   the id in your connector's tool names: `mcp__<id>__get_opportunities`.
3. Use it: the panel shows live counts and one-click Daily Plan, Refresh, and Track.
   For Triage and Draft, type them in the Cowork chat (those need the model).

Pros: a real dashboard with buttons; live pipeline counts. Cons: desktop-only / one
machine; Triage and Draft are typed, not buttons.

## Option B — Claude Chat (works anywhere, no UI)
1. Create a Claude Project named "Job Search Command Center".
2. Paste your finished `project-instructions-template.txt` into the Project's
   instructions.
3. Enable the "Job Search Command Center" connector for the Project.
4. Add `how-to-use-claude-chat.txt` as a Project file (or paste its commands at the
   top of the instructions) so the commands are always handy.
5. Use it: open the Project and type a command, e.g. `Triage this role: <paste a job>`,
   `Build today's daily plan`, `Track update: Acme - I applied today`.

Pros: anywhere incl. mobile, full-quality model, free on your plan, nothing to host
locally. Cons: no buttons; you must know the commands (the cheat-sheet covers this).

Many people use both: Cowork at the desk, Chat on the go. Both read and write the same
Sheet, so they stay in sync.

------------------------------------------------------------------------
# Troubleshooting (the things that bite people)

- Endpoint returns 404: the route is missing the `{ basePath: "/api" }` argument, or
  `route.ts` is not at `app/api/[transport]/route.ts` in the repo.
- Connector reads but cannot write: confirm both env vars are set in Vercel and you
  redeployed after adding them.
- "unauthorized" from the chain: the API_KEY in Vercel does not match the Script
  Property on the Apps Script.
- Unverified-app warning on deploy: expected for your own script; Advanced -> Go to
  (unsafe) -> Allow.
- Connector tools not appearing: re-open Customize -> Connectors and confirm it
  connected; you may need to toggle the tools to Always allow.
- The Cowork panel's Triage/Draft do nothing or time out: that is expected. A pinned
  panel cannot run the model; type Triage and Draft in the chat.
- Wrong Google account: the Apps Script must be deployed by the account that owns the
  Sheet.

------------------------------------------------------------------------
# What is in this kit
- GUIDE.md ............................ this file
- sheet-headers.txt .................. the 26-column header row for the Sheet
- apps-script.gs ..................... the Google Apps Script web app
- mcp-server/ ....................... the MCP server to deploy to Vercel
- project-instructions-template.txt .. the agent brain (with SETUP MODE; add your profile)
- candidate-profile-template.txt ..... blank profile to fill (or let SETUP build it)
- how-to-use-claude-chat.txt ......... command cheat-sheet for the Chat option
- cowork-control-panel-template.html . the pinned dashboard panel for the Cowork option
