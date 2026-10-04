# Harrow Ask
A simple English/Thai staff chatbot, converted from GemsBot and the earlier Ask Harrow preview. Staff see a greeting and one chat composer. The deployed app does not include Gem directories, demo policies, upload controls or Gemini File Search answers.

## Current status
The staff UI and server gateway adapter are implemented. **Live NotebookLM answers are not connected.** No notebook ID, school NotebookLM gateway, Google OAuth configuration or staff roster has been supplied or acceptance-tested. The site clearly shows this state and disables sending questions.

The NotebookLM gateway below is a custom school integration contract, NOT an official Google NotebookLM chat endpoint. Google's documented NotebookLM Enterprise APIs currently describe notebook/source management; those management calls do not by themselves implement this chat contract. A shared notebook link alone cannot power an in-app chat. School IT must supply a supported, approved integration capable of querying that notebook, or reconsider using NotebookLM's own chat UI. Do not use unofficial scraping, browser cookies or personal login tokens.

## Deployment
Netlify publishes only public/, bundles netlify/functions/ask.mjs and runs node --test tests/server.test.mjs. Node 22. No npm dependencies.
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
node --test tests/server.test.mjs
Covers Google token signatures, pupil exclusion, fixed NotebookLM scope, unconfigured service, missing grounding, legacy endpoint removal, cross-origin requests and secret redaction. Gateway requests use test fixtures, not live NotebookLM.
Before activation: validate allowed/disallowed staff sign-in, real notebook answers/citations, unknown/conflicting sources, follow-ups and English/Thai responses.
