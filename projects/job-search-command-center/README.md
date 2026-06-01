# Job Search Command Center GPT

Project workspace for updating and releasing the Job Search Command Center GPT, and surfacing it through a new section on the FutureInSites Resources page.

## Goal

Take the personal, optimized version of the Job Search Command Center GPT and turn it into a public-facing resource on futureinsites.com. Two possible end states, to be confirmed:

1. **Public hosted GPT** — a custom GPT published in OpenAI, set to "anyone with the link," that visitors can use directly in their own ChatGPT accounts. Resources page links to it.
2. **Copy-paste instructions** — the refreshed instructions and any supporting code/knowledge posted on the Resources page so people can build their own GPT.
3. **Both** — link the public GPT and offer the instructions as a fallback. (Preferred direction stated by Greg.)

## Status

- 2026-06-01: Project folder created. Confirmed there is no existing Job Search Command Center content anywhere in the repo (net-new). Resources page uses a card layout with two sections: References, Primers.
- 2026-06-01: Greg confirmed this should be a new Resources section, working name "Public Tools" or "Open Source Tools & Guides". Job Search Command Center is the first entry. Section is intended to grow (future open tools and guides).
- 2026-06-01: Section name LOCKED: **Open Source Tools & Guides**.
- 2026-06-01: Architecture LOCKED: dedicated page `job-search-command-center.html` (cloned from the article-page template, e.g. building-ai-agents.html) holds the full write-up + GPT link + copy-paste instructions. A card/blurb gets added to `resources.html` only at the end, so the page stays invisible to visitors while in progress.

## BUILD COMPLETE (2026-06-01) — option 1, DIY kit

Public, de-personalized kit + dedicated page built. Resources section now live (links the page).

Deliverables:
- `tools/job-search-command-center/gpt-instructions.txt` — public instructions, profile stripped, SETUP MODE added, 6,698 chars (< 8,000 cap).
- `tools/job-search-command-center/openapi-schema.json` — servers URL → `https://YOUR-PROJECT.vercel.app`.
- `tools/job-search-command-center/apps-script.gs` — generic, with setup header comment.
- `tools/job-search-command-center/sheet-headers.txt` — canonical header row + notes.
- `tools/job-search-command-center/vercel-proxy/` — `api/proxy.js`, `api/proxy-bulk.js` (both ESM, GET hardened), `package.json`, `README.md`.
- `job-search-command-center.html` — dedicated page (article template). Loads kit files into copy boxes at runtime + download links. Architecture SVG. 5-step guide.
- `images/job-search-command-center-thumb.svg` — Resources card thumbnail.
- `resources.html` — NEW "Open Source Tools & Guides" section + card (placed between References and Primers).

Verified: char cap, no personal-data leaks in public files, all file refs resolve, valid JSON, HTML tags balanced.

NEXT (Greg): commit + push via GitHub Desktop so Vercel deploys. Then review the live page. Note: the runtime copy boxes fetch same-origin files, so they populate on the deployed site (not via file://). Privacy-policy page still needed only if we later publish a hosted public GPT.

## LAUNCH DECISION (2026-06-01)

- SHIP NOW = **Option A: proven Vercel build** (GPT → Vercel proxy → Apps Script → Sheet). It's what Greg validated over many hours. Repo restored to this after a Google-only detour. Kept today's good additions: "Why it helps" benefits section, DRAFT conversation starter, cover-letter capability, intro rework.
- Principle (Greg): dogfood with rigor before releasing changes.

## Option B (Google-only, no Vercel) — DEFERRED to Greg's personal validation

Plan: Greg implements Option B on his PERSONAL setup first (backups exist), validates live, and only then do we update the PUBLIC files.

Validated so far (2026-06-01, via PowerShell against Greg's live Apps Script):
- GET read with `?api_key=` works directly. 
- Single POST write with `?api_key=` (flat body) works — row landed in Sheet. Redirect preserves POST for a redirect-following client.
- NOT yet tested: update-existing (dedup match), and bulk.

What Option B needs (tomorrow):
1. Schema → servers `https://script.google.com`, path `/macros/s/YOUR_DEPLOYMENT_ID/exec`, GET+POST, `api_key` as required query param (default placeholder), FLAT Opportunity POST body (no `{opportunity}` wrapper — Apps Script reads body fields at top level).
2. GPT Action auth = **None** (key rides in the query param).
3. **Port bulk into the Apps Script**: add a `doPost` branch that accepts `{items:[...]}` and loops writing each (this replaces the Vercel `proxy-bulk` fan-out — the one real capability lost without Vercel). Greg flagged this.
4. Minor: schema types `id` as string (proxy used to coerce id→String); keep instruction "send id as a string".
5. Validation gate before public update: single write, update-to-existing (confirms update not duplicate), and a 2-3 item bulk write.

## Materials received (current optimized version)

- 2026-06-01: `google_apps_script.txt` — sheet-bound webhook API. Sheet name "Job Search Command Center - Opportunities". API-key auth (script property `API_KEY`, via `x-api-key` header or `?api_key=`/`?key=`). `doGet` returns/filters opportunities (id, company, company_slug, status, limit, `summaries`, `include_jd`); `doPost` upserts by `id`. `normalizeRecord_` parses JSON fields (`unknowns`, `score_snapshot`) and coerces booleans (`score_locked`, `location_compatible`, `warm_intro_available`). Self-contained and per-user deployable → fits the DIY public model cleanly.

- 2026-06-01: `openai.gpt.instructions.txt` — the GPT system prompt. Strict TRIAGE/TRACK agent. SCORING METHODOLOGY: BF/LI/CR each 0-100, weighted score = BF*0.5 + LI*0.3 + CR*0.2; verdicts Strong Yes >=85 / Apply 70-84 / Investigate 55-69 / Pass <55; CR="Unknown" weighted as BF+LI avg when comp undisclosed. Persists to Sheet when score >=55. Dedup via job_fingerprint = hash(company + role_family + seniority + location). Opportunity Record model + pipeline hygiene rules. Contains Greg's real CANDIDATE PROFILE (must be stripped for public version).

- 2026-06-01: GPT builder config (from screenshot). Name: "Job Search Command Center". Description: "Triage, track, and plan daily job search execution using a canonical opportunity record." Conversation starters: (1) TRIAGE: Evaluate and prioritize a new role (Paste a job description or link); (2) TRACK: Update the status of an existing opportunity (e.g., "I applied today" or "Recruiter replied, set to waiting on them"); (3) DAILY PLAN: Create today's job-search plan (Assume follow-ups later today unless I say otherwise); (4) REFRESH ALL: Run diagnostics on my pipeline (Flag stale follow-ups, no-response applications, and missing info). Recommended model: none. Capabilities: Web Search ON, Canvas ON, Image Generation ON, Code Interpreter OFF. Knowledge files: none. Actions section was below the screenshot fold (still needed).

- 2026-06-01: GPT Actions (from screenshot). GPT status: **Live · Only me** (private). Auth: API Key. Actions call a Vercel proxy (not the Apps Script directly): `getOpportunities` GET `/api/proxy`; `upsertOpportunity` POST `/api/proxy`; `upsertOpportunitiesBulk` POST `/api/proxy-bulk`. OpenAPI schema visible only at bottom (UpsertOpportunityResponse, GetOpportunitiesResponse → Opportunity ref); top/servers URL + request schemas not yet captured. Privacy policy = placeholder.
- OPEN QUESTION: `proxy-bulk`/`upsertOpportunitiesBulk` has no matching bulk path in the Apps Script provided (only single doGet/doPost). Does the Vercel proxy fan out to single POSTs, or is there a newer Apps Script with a bulk endpoint?
- REQUIREMENT for public publish: OpenAI needs a valid privacy policy URL for any Action-using GPT shared beyond "Only me". Plan: add a privacy policy page on futureinsites.com and point the GPT at it.

- 2026-06-01: `GPT API Key Authentication Schema.txt` — full OpenAPI 3.1.0 ("JSCC Proxy" v1.0.3). servers URL = Greg's personal Vercel deployment (REDACT → placeholder for public). Auth: ApiKeyAuth header `x-api-key`. Paths: GET /api/proxy (getOpportunities; params status, limit, summaries); POST /api/proxy (upsertOpportunity; body `{opportunity: Opportunity}`); POST /api/proxy-bulk (upsertOpportunitiesBulk; body `{items: [Opportunity]}`).
- CANONICAL Opportunity field set (= Sheet columns; confirm header order): id, company, company_slug, role, link, status, waiting_reason, status_reason, date_added, date_applied, comp_base_min, comp_base_max, comp_range_text, location_compatible, warm_intro_available, recruiter_contact, unknowns, why_deprioritized, last_action_date, next_action, score_locked, score_snapshot, notes, jd_text, jd_source, jd_captured_at. Required: id, company, company_slug, role, status, date_added.
- RESOLVED (pending Vercel code confirm): proxy unwraps `{opportunity}` → top-level before forwarding to Apps Script `doPost` (which reads `body[header]`). proxy-bulk likely fans `{items}` out to single doPost calls (script has no bulk path).
- STILL NEEDED (last build-critical): Vercel proxy code for /api/proxy and /api/proxy-bulk. Original DIY docs now optional (writing fresh from current code).

- 2026-06-01: `proxy.js.txt` + `proxy-bulk.mjs.txt` — Vercel proxy. Auth: `x-api-key` must equal env `PROXY_TOKEN`. Env: `PROXY_TOKEN`, `APPS_SCRIPT_URL`, `APPS_SCRIPT_KEY`. `proxy.js`: GET forwards query params to Apps Script (`?api_key=APPS_SCRIPT_KEY`); POST unwraps `{opportunity}`/`{record}`, coerces id→string, forwards. `proxy-bulk.mjs`: POST `{items:[...]}` fans out one Apps Script POST per item, returns per-item summary. CONFIRMS: proxy unwraps for the script; bulk = fan-out.
- CLEANUP for public: standardize module types (proxy.js uses `export default` but .js; add package.json / vercel.json), harden GET so client can't override `api_key` via query.

## Full architecture (confirmed)

`GPT --x-api-key(PROXY_TOKEN)--> Vercel proxy /api/proxy & /api/proxy-bulk --?api_key(APPS_SCRIPT_KEY)--> Apps Script doGet/doPost --> Google Sheet`

## Publishing model decision (KEY)

A published GPT has fixed Actions (baked-in key + backend URL for all users). Since this tool persists each user's private pipeline, publishing Greg's GPT as-is would write everyone's data to Greg's Sheet. Therefore "public" = one of:
1. **Build-your-own kit (RECOMMENDED, pending Greg go-ahead)** — page hosts instructions + OpenAPI schema + proxy code + Apps Script + Sheet schema + step-by-step guide; each user stands up their own private stack (~15-20 min).
2. Kit + published demo GPT (guided front door, no shared backend writes).
3. Fully hosted multi-user via per-user Google OAuth (separate, larger build).

## Resume / character-cap handling (Greg's admin note + decision)

- OpenAI GPT instructions are capped at ~8,000 characters. Current file (8,547 B incl. note + full profile) is already at the cap, so public users cannot paste a full resume.
- PLAN: in the public instructions, replace the entire CANDIDATE PROFILE with a placeholder (`CANDIDATE PROFILE: <PASTE YOUR PROFILE HERE — see setup>`). Strip Greg's real profile entirely.
- PLAN: add a **SETUP MODE** to the public instructions — on first run or "setup", the GPT takes the user's pasted resume and returns a compressed CANDIDATE PROFILE in the exact scoring schema (Targeting / Seniority & Scope / AI-ML / Platform & Data / Roles / Education / Fit Signals) under a fixed character budget, for them to paste into their own copy. The GPT can't self-edit, so it generates the block for the user to paste.
- PLAN: also ship the same compression prompt as standalone copy-paste text in the guide (fallback for any LLM).

## Architecture decision: public GPT

Two models, decision pending:
1. **DIY public GPT** (likely best fit) — publish GPT + guide; each user deploys their own copy of the Apps Script + Vercel endpoint and a copy of the Sheet, pasting their own URLs/keys into their own GPT copy. No shared infra, no shared data/cost.
2. **Hosted public GPT** — all users hit Greg's Vercel + Google account; only safe with per-user OAuth, otherwise shared sheet/cost. More work.

## Open items / needed inputs

- [ ] Current GPT instructions + conversation starters.
- [ ] Current Vercel code for the Command Center (separate from the site's `api/` form endpoints).
- [ ] Original public DIY docs (to diff against the live version and clear known bugs).
- [ ] Exact Google Sheet header row (ordered column list) — script reads/writes by header name.
- [ ] Decision: public hosted GPT, instructions-only, or both.
- [ ] If publishing publicly: confirm ChatGPT Plus/Team access and whether Greg publishes manually or Claude drives the OpenAI builder via Chrome.
- [ ] Public share link for the GPT (once published) to wire into the Resources page.

## Files in this folder

- `README.md` — this overview.
- `instructions/` — versioned copies of the GPT instructions (current + optimized).
- `assets/` — any thumbnail or card image for the Resources entry.

## Notes

- This folder lives inside the deployed site repo. It is committed for backup via GitHub Desktop but is unlinked from navigation. If internal notes should not be publicly reachable by URL, add `projects/` to `.gitignore`.
