# Ask Harrow

A staff-facing school support hub. The default route finds a departmental NotebookLM / Gemini Notebook for questions grounded in school documents. A separate task route opens a linked Gemini assistant for drafting or repeatable work.

## Run

No build or dependencies are required. Serve this directory, for example with `python -m http.server 8765`, then open http://localhost:8765. Netlify can publish the repository root without a build command.

## Files

- `index.html`, `ask-harrow.js`, `ask-harrow.css`: the maintainable staff interface and bilingual tutorial.
- `ask-harrow-core.mjs`: URL/configuration validation, readiness and department matching.
- `ask-harrow.config.json`: the published department configuration used by all staff.
- `legacy.html` and `assets/`: the previous compiled prototype, retained for reference; its seed data and approval claims are not verified.

## Connect a department

Open Department setup. Add the actual shared notebook URL, owner, checked source documents and review date. Confirm only after testing school-account access and representative questions. A task helper can be connected separately with a Gemini Gem link. Skills can be supported via appropriate shared links when available; no Skill API is integrated.

The setup form saves a browser-local preview, clearly identified by a banner. Export the JSON, replace `ask-harrow.config.json` in this repository, and deploy to publish changes for everyone. Import validates the schema, URLs and required connection details. A local draft remains until the user chooses Use published version. This is configuration editing, not authenticated administration. The website contains no shared admin database or login system.

All default departments are unconnected templates. No new notebooks have been created, no document content is uploaded by this site, and no account permissions are granted. Do not put private document text, tokens or pupil records in this public repository. Links are not access controls; the linked school services manage their own permissions.

## Staff flow

Type a topic/question → choose a suggested department → copy the question → open its shared notebook → paste and ask. Matching is local keyword-based routing, not an AI answer or automatic question submission. The copy adds short-answer/source instructions and the selected language. Task requests use a separate route. Source citations are produced by the external notebook, not by this hub.

## Languages and preferences

English and Thai cover the interface and tutorial. Department names and example questions have both translations. Language, stars and optional setup drafts use separate `ask-harrow-*` storage keys. Existing prototype storage is preserved and not treated as verified live data. Questions are held in memory; they are not saved or sent by the hub.

## Validation

Run `node --test tests/core.test.mjs`. With Playwright and Chromium installed, run `node tests/browser-smoke.cjs` (or set `BROWSER_EXECUTABLE_PATH` to an existing Chromium executable). The browser test serves local files through intercepted test requests; it does not call the real school assistants.

Browser smoke tests cover the staff routes, configuration import/export, local preview readiness, language, favourites and tutorial. Desktop, mobile, English, Thai and tutorial screenshots were also visually inspected. Local fonts include their open-source licences in `fonts/`. Original source files for the former compiled prototype are not needed to maintain the new app.
