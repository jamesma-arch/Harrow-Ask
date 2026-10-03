# Ask Harrow

A single English/Thai chat screen for staff questions, backed by Gemini File Search. School sources stay in a dedicated Google File Search store. Only server-authorised admins can list, upload or delete documents; staff receive concise answers and source titles. A bilingual tutorial explains the flow.

## Current readiness

The UI and server integration are implemented. **Live Google sign-in, document indexing and Gemini answers still require the school's configuration and an end-to-end acceptance check.** There are no real school answers, credentials or approved documents built into this version. A separate, explicitly labelled fictional demo runs locally in the browser. Missing configuration shows a setup message and the API fails closed.

This is a custom Gemini API integration, not an embedded Gem or NotebookLM notebook. Existing Gemini Workspace licences do not configure or fund this API automatically. School IT must select an approved Google project and billing/data arrangements.

## Concept demo

When Google is not configured, the homepage opens in Demo Mode. You can also select Try demo chat. No school sign-in is needed for fictional examples. Topics: absence, room bookings, IT support, trips, maintenance and supplies. Ask a topic question, then “What details should I include?” to see a contextual follow-up. English and Thai are supported. Unknown topics get a clear fallback.

This is a deterministic concept demo, not live AI or approved Harrow policy. Every sample answer and source is labelled. Demo conversations never call the Gemini API, never join live chat history, and grant no admin access. Exit demo clears the conversation and returns to the authenticated service.

## Netlify configuration

Netlify publishes only `public/` and bundles `netlify/functions/ask.mjs`. Root legacy assets/configuration are retained for history but are not part of the deployed public site. The build runs server security/contract tests with Node 22 or later. No runtime npm dependencies are required.

Set the following **server-side Netlify environment variables**, scoped to Functions. Redeploy after changing them. Never put secrets in public files or commit them.

| Variable | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` | Web OAuth client ID from the school Google project |
| `GOOGLE_ALLOWED_DOMAIN` | School Workspace domain, e.g. `harrowschool.ac.th` |
| `STAFF_EMAILS` | Comma-separated explicit approved staff email addresses |
| `ADMIN_EMAILS` | Comma-separated explicit admin email addresses; these accounts also have staff access |
| `GEMINI_API_KEY` | Server-only key for the approved Google project |
| `GEMINI_FILE_SEARCH_STORE` | Dedicated store resource name, exactly `fileSearchStores/<id>` |
| `GEMINI_MODEL` | A model available to that project supporting File Search through `generateContent` |

A Workspace domain may contain pupil accounts. Domain sign-in alone is deliberately insufficient: accounts must also appear in `STAFF_EMAILS` or `ADMIN_EMAILS`. For a large roll-out replace these rosters with school-managed staff-group verification before launch. Removing access from the server roster takes effect on the next request after environment deployment.

In Google Cloud, configure the OAuth consent screen for the school and add the exact Netlify production and trusted preview origins as authorised JavaScript origins. Do not expose production secrets to untrusted PR deployments. Create a dedicated File Search store using the [Google File Search API](https://ai.google.dev/api/file-search/file-search-stores), then set its returned resource name above. Choose the model from current [File Search documentation](https://ai.google.dev/gemini-api/docs/generate-content/file-search). Configure Google project quotas/budget alerts and Netlify traffic limits before broad access; this app does not implement a distributed per-user rate limiter.

## Document workflow

1. Sign in with an allowlisted admin account and select Admin.
2. Upload a PDF, plain text or Markdown document up to 2 MB, with a clear title and responsible department. Confirm it is current and approved for every authorised staff user.
3. Refresh the source list until its state is Ready. A failed item needs correction and re-uploading.
4. Test several known questions in English and Thai, including missing and conflicting information.
5. To replace a document, upload the current version, verify indexing, then remove the obsolete version. Removal requires typing its exact title and is permanent in this store.

This first version has one all-staff knowledge collection. **Admin-only management is not confidential-content filtering**: uploaded contents may be returned to all authorised staff. Do not add individual HR or pupil case records. The app does not synchronise Drive folders or enforce Drive document ACLs. Keep originals in the school's existing governed repository; this store holds the searchable copies.

## Answer behaviour and limits

The server fixes the store, model and instructions; the browser cannot choose another source collection. It requests short answers based on retrieved school documents and withholds generated answers without grounding support/citations, or incomplete model responses. Source titles are displayed, not raw source links. Grounding is evidence of retrieval, not a guarantee every sentence is correct: owners should validate representative answers and maintain current sources.

Google ID tokens are signature-checked using Google's fixed JWKS endpoint, with issuer, audience, expiry, verified email, hosted domain and staff/admin roster checks. Tokens and conversation are held in browser memory, never localStorage. Only language preference is stored locally. Chat history (up to six prior turns) is sent with follow-up questions. The application does not persist chat logs; requests/documents are processed by Google and hosting providers under the school's selected service terms. Sign-out clears local chat state. Tokens expire and require sign-in again.

## Validation

Run `node --test tests/server.test.mjs`. Tests cover forged/expired tokens, incorrect audience/domain, pupil exclusion, admin endpoint protection, cross-origin rejection, fixed retrieval scope, secret redaction, missing setup, and withholding ungrounded responses. `tests/chat-browser.cjs` exercises the UI with explicit test-only HTTP fixtures; it is not a live Google integration test.

Before production: confirm real sign-in from allowed/disallowed accounts, upload/index a harmless approved test document, verify a grounded answer and unknown-answer fallback, check Thai wording with a Thai-speaking colleague, and confirm deletion removes retrieval. Then test expected concurrent staff load and the project's quotas. Existing PR preview is for review; do not merge until school setup and acceptance checks are complete.

References: [Google identity verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [Netlify functions](https://docs.netlify.com/build/functions/get-started/).
