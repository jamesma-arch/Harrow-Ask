# Harrow Ask — department source pilot

Harrow Ask gives authorised staff one English/Thai chat screen. The LS CCA pilot uses approved original documents in a Google Drive folder and Gemini File Search for retrieval and citations. The department's NotebookLM link remains available for its own use. Harrow Ask does not query, export, scrape or refresh NotebookLM itself.

## Status

Implementation and fixture tests are ready on `codex/drive-source-pilot` for review. No live Drive folder, Google service credentials, model selection or staff OAuth configuration has been connected or acceptance-tested in this pilot. Do not label it live. The Netlify production branch is unchanged.

## Department workflow

1. Maintain approved originals in one department Drive folder. Use those originals as sources in the department's NotebookLM notebook too.
2. An administrator assigns the folder and the lead's school email in Department notebooks, approves the sources for all authorised staff and enables the department.
3. The assigned lead can view and sync only their own departments. Only administrators can change ownership, folders, approval, activation or archival. Leads must also be in the staff allowlist.
4. Update the originals and select **Sync department**. The app imports a complete replacement source set, waits for indexing and verifies the folder has not changed during sync. It activates that set only after success.
5. If a tab closes, **Continue sync** resumes the persisted job. Progress, last successful sync, source count, file versions and sanitised failures are visible. Jobs expire after 30 minutes and can then restart.
6. Refresh NotebookLM sources separately using Google's notebook controls. Sync department updates Harrow Ask only.

Failed syncs retain the last successful set, which may be out of date. For urgent withdrawals, an administrator must pause or archive the department, then fix and sync before enabling again. Empty-folder sync removes all active sources. Folder changes invalidate the old active set immediately. Drive document removal takes effect in answers after successful sync.

## Pilot limits

- Files directly in the folder: no recursion, nested folders or shortcuts. Unsupported entries fail the whole sync rather than being silently skipped.
- Up to 40 files, each up to 8 MB. Supported: PDF, TXT, Markdown, CSV/TSV, XLSX, DOCX and PPTX. Native Google Docs and Slides export as PDF; Google Sheets export as XLSX, retaining worksheet tabs. Google's export limits also apply.
- Spreadsheet imports include the entire workbook, potentially including hidden sheets. Use a sanitised staff-facing workbook. Do not use the original Season 1 administration workbook until confidential worksheets are removed.
- Progress uses short authenticated requests driven by the browser, avoiding one long Netlify function invocation.
- Every sync rebuilds the complete index. Retired and failed indexes are not automatically deleted in this pilot. The Google administrator must review and remove unused File Search stores before broad production use. Drive originals and NotebookLM sources are never deleted by this app.

## School IT setup

Use an approved school Google project. No personal Google passwords, browser cookies, undocumented notebook endpoints or domain-wide delegation are required.

1. Enable Drive API for a dedicated service account and grant it Viewer access to the approved source folder (or the school-approved shared-drive scope). The app uses `drive.readonly` and never impersonates staff.
2. Configure an approved Gemini API key and a File Search-capable model supporting `generateContent`. Confirm availability and quota in the school's account.
3. Configure a Google web OAuth client for staff sign-in, authorising the exact private-preview origin. Add the production origin when deployment is approved.
4. Set these as protected server environment variables, never frontend variables or repository files:

| Variable | Purpose |
|---|---|
| `ANSWER_PROVIDER` | `drive-file-search` explicitly opts into the pilot |
| `GEMINI_API_KEY` | Server-only Gemini credential |
| `GEMINI_MODEL` | Approved File Search-capable model ID, without `models/` |
| `DRIVE_SERVICE_ACCOUNT_EMAIL` | Dedicated Drive service account email |
| `DRIVE_SERVICE_ACCOUNT_PRIVATE_KEY` | Existing PEM key; newlines or escaped newline sequences accepted |
| `GOOGLE_CLIENT_ID` | Staff web OAuth client ID |
| `GOOGLE_ALLOWED_DOMAIN` | School Workspace domain |
| `ADMIN_EMAILS` | Comma-separated administrator allowlist |
| `STAFF_EMAILS` | Comma-separated staff allowlist, including department leads |

5. Publish a private preview from `codex/drive-source-pilot`. Sign in as administrator, assign the LS CCA source folder and lead, approve suitable sources, and run the first sync.
6. Acceptance-test real questions, cited originals, missing/conflicting information, Thai answers, pending policy, ownership and changed/deleted sources before promoting to production.

Department and sync state persist in separate Netlify Blobs stores. Preview storage is isolated by deployment ID; production state persists across deployments. Conditional writes and leases prevent conflicting edits/syncs. Source bytes are not committed or returned from the sync API.

## Answers and evidence

Only approved, enabled, unarchived departments with a successfully indexed matching folder can supply answers. Browser-supplied stores are ignored. The prompt treats documents as evidence, not instructions, and distinguishes draft guidance, pending approvals and conflicts.

Answers need grounding support mapped to unique documents in the active manifest, otherwise they are withheld. Source activation is rechecked after retrieval. Citations contain the department, original Drive link, modification time and sync time; the chat displays links and sync times. Metadata validation does not independently prove every sentence is supported. Live answer quality requires school acceptance testing.

Sign-in tokens and conversations stay in browser memory. Only language preference persists locally. Gemini receives the question, recent conversation and selected store names. The Drive service token is used only with Drive API. A school-domain email alone never grants staff access.

The older custom NotebookLM gateway is retained for compatibility when `ANSWER_PROVIDER` is not `drive-file-search`. It still needs a supported school integration; a notebook link alone never enables it.

## Validation

Run `npm test`. Drive, Gemini and storage are fixtures. Tests cover authentication, ownership, sync publication, asynchronous indexing, concurrency, failures, source withdrawal, file versions, unsafe upload destinations, citations and demo isolation. Passing tests do not establish live Google connectivity.

The scripted LS CCA demo stays clearly labelled and separate from live sources.

### Guided tutorial

The header Tutorial button opens a replayable English/Thai walkthrough with the CCA QA gold spotlight and dimmed background. Chat guidance covers access, questions, citations, demo and language. Open Department notebooks and choose Tutorial for the department lead sync walkthrough. Next, Back, Finish, close and Escape support keyboard use; the guide never starts a sync or sends a question.
