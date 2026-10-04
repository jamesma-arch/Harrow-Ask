# Harrow Ask
A simple English/Thai staff chatbot, converted from GemsBot and the earlier Ask Harrow preview. Staff see a greeting and one chat composer. The deployed app does not include Gem directories, demo policies, upload controls or Gemini File Search answers.

## Current status
The staff UI and server gateway adapter are implemented. **Live NotebookLM answers are not connected.** No notebook ID, school NotebookLM gateway, Google OAuth configuration or staff roster has been supplied or acceptance-tested. The site clearly shows this state and disables sending questions.

The NotebookLM gateway below is a custom school integration contract, NOT an official Google NotebookLM chat endpoint. Google's documented NotebookLM Enterprise APIs currently describe notebook/source management; those management calls do not by themselves implement this chat contract. A shared notebook link alone cannot power an in-app chat. School IT must supply a supported, approved integration capable of querying that notebook, or reconsider using NotebookLM's own chat UI. Do not use unofficial scraping, browser cookies or personal login tokens.

## Deployment
Netlify publishes only public/, bundles netlify/functions/ask.mjs and runs npm test. Node 22. Uses @netlify/blobs for the department registry; jsdom is used by UI tests.
Repository: jamesma-arch/Harrow-Ask. Production branch: main.

## Server configuration
Set only after the supported school integration is available:
- GOOGLE_CLIENT_ID: approved school web OAuth client
- GOOGLE_ALLOWED_DOMAIN: school Workspace domain
- STAFF_EMAILS / ADMIN_EMAILS: explicit permitted staff emails; pupil accounts do not gain access simply by sharing a domain
- NOTEBOOKLM_CHAT_ENDPOINT: approved HTTPS school gateway endpoint (fixed server-side)
- NOTEBOOKLM_GATEWAY_TOKEN: server-only gateway bearer credential
- NOTEBOOKLM_NOTEBOOK_ID: fixed approved notebook identifier

Do not commit credentials or school source contents. Redeploy after configuring function variables. Authorise the exact production origin in Google OAuth.
Questions and prior turns are sent to the configured school gateway only after staff authentication. Chat/token state stays in browser memory; only language preference persists.

## Gateway contract
POST JSON: { provider: "notebooklm", notebookId, message, language: "en" | "th", history: [{ role: "user" | "model", text }], user: { email }, sourcePolicy: "notebook-only" }.
The gateway must authenticate the app, enforce notebook permissions, query only the configured NotebookLM notebook, and return no general-model fallback.
Response: { provider: "notebooklm", notebookId, supported: true, text, citations: [{ title, sourceId }] }.
The adapter rejects wrong providers/notebooks and withholds answers without citations. Those metadata checks rely on a trusted gateway; they are not independent proof of grounding. Real notebook provenance must be verified in the gateway acceptance check.

No document uploads, edits or deletions in Harrow Ask. Maintain sources in NotebookLM.

## Validation
npm test
Covers Google token signatures, pupil exclusion, fixed NotebookLM scope, unconfigured service, missing grounding, legacy endpoint removal, cross-origin requests and secret redaction. Gateway requests use test fixtures, not live NotebookLM.
Before activation: validate allowed/disallowed staff sign-in, real notebook answers/citations, unknown/conflicting sources, follow-ups and English/Thai responses.

## Department notebook workspace (v1.1)
Open **Department notebooks** in the header. Administrators can save draft departments before creating notebooks, add a title/description/owner, paste a NotebookLM link or ID, approve it for all staff, and include or pause it. Archive removes it from the chat's source set; archived entries can be restored through Edit. The UI is English for this administration workspace; staff chat remains English/Thai.

The registry persists in a server-side Netlify Blobs store across production deployments. Preview stores are isolated from production. Strong reads and conditional writes prevent stale administrator saves from overwriting each other. These controls and the UI require the school Google OAuth setup and ADMIN_EMAILS allowlist, even while the chat gateway is not configured. No school sign-in credentials have been supplied yet.

The chat sends only approved, enabled, unarchived notebook IDs from the server registry to the configured gateway. The browser cannot select a different notebook or inject a source set. The gateway must query across the supplied notebooks and return citations with each notebookId; the app labels citations with the associated department and withholds answers citing excluded notebooks. This implements source registration and routing, not a Google NotebookLM chat API or automatic document sync. Live multi-notebook retrieval is still pending the supported school integration.

Multi-notebook gateway request: notebooks: [{ notebookId, department, title }]. The legacy notebookId property is also sent when exactly one notebook is selected. Response citations: [{ title, sourceId, notebookId }]. An optional response-level notebookId can be used for single-notebook responses. All referenced notebook IDs must belong to the supplied list.

The NOTEBOOKLM_NOTEBOOK_ID environment variable is now optional. It is used only as a compatibility fallback while the registry has never been populated; an archived/paused registry does not re-enable that fallback. Manage source contents and permissions in NotebookLM itself.

Run npm test for all 28 tests, including registry persistence, concurrent edits, admin-only access, source activation/archival, cross-department routing and excluded-source withholding. Storage and NotebookLM gateway calls are fixtures in tests; live school acceptance is not yet complete.

The initial admin catalog includes a demo **Lower School CCA** draft with no notebook link or ID. It supplies no chat answers until an administrator adds a notebook and approves/enables it. Before sign-in, only this public sample is displayed; saved department records remain protected. The first admin edit saves the draft in the registry, and archiving it does not recreate it.
