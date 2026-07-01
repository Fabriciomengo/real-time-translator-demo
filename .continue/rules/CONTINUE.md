# Continue Project Guide

> **Status:** This guide was generated from analysis of the actual repository (`real-time-translator`). Some deployment-specific details (e.g., Cloudflare Pages configuration, ngrok domains) should be verified by the team and updated as the project evolves.

## 1. Project Overview

**Real-time Translator Bot** is a React + TypeScript + Vite web application that acts as an "output media" overlay for [Recall.ai](https://www.recall.ai/) meeting bots. When a Recall.ai bot joins a video call (Google Meet, Zoom, etc.), it can render this app as a screenshare inside the meeting. The app:

1. Connects to Recall.ai's real-time transcript WebSocket (`wss://meeting-data.bot.recall.ai/api/v1/transcript`) to receive live speech-to-text transcripts (partial and final) with speaker labels.
2. Sends finalized transcript text to the **Groq API** (`https://api.groq.com/openai/v1/chat/completions`) for translation into one or more target languages.
3. Renders the original transcript alongside live translations in a scrolling, auto-clearing UI designed to be visible as a meeting overlay.
4. Supports voice-driven language switching via wake phrases (e.g., "Hey Translator, switch to French") detected in the transcript text.

### Key Technologies

- **React 18** + **TypeScript** for the UI
- **Vite** for dev server and build tooling
- **Recall.ai** real-time transcript WebSocket API (external, third-party bot infrastructure)
- **Groq API** (OpenAI-compatible chat completions endpoint) for LLM-based translation
- **ESLint** (flat config, `typescript-eslint`) for linting
- **Cloudflare Pages** appears to be the deployment target (per comments in `src/config/theme.ts`), with per-client theming driven by env vars
- **ngrok** for local tunnel exposure so a real Recall.ai bot can reach the locally running dev server

### High-Level Architecture

```
Recall.ai Bot (in meeting)
        │  joins meeting, renders this app as screenshare
        ▼
index.html / main.tsx / App.tsx
        │
        ▼
Transcript.tsx  ──uses──▶  useTranscriptWebSocket (hook)
        │                         │
        │                         ├─ opens WebSocket to Recall.ai transcript endpoint
        │                         ├─ buffers partial vs. final utterances
        │                         ├─ queues final utterances for translation (one at a time)
        │                         └─ calls translateText() per target language
        │                                   │
        │                                   ▼
        │                          src/utils/translate.ts
        │                                   │  POSTs to Groq chat completions API
        │                                   ▼
        │                             Groq-hosted LLM model
        ▼
Rendered original + translated text, auto-scrolling, auto-clearing every 60s
```

Key architectural points:

- There is **no backend server** in this repo — it's a static Vite/React SPA. The "backend" for transcription is Recall.ai's hosted WebSocket, and the "backend" for translation is Groq's hosted API, called directly from the browser using a `VITE_`-prefixed API key.
- Translations are processed via a **serial queue** (`finalQueue` in `useTranscriptWebSocket.ts`) so multiple finalized utterances translate one at a time, not concurrently, to avoid overwhelming the API and to help preserve conversational order.
- Partial (non-final) transcripts are shown immediately without translation; only finalized transcripts get translated.
- Language detection/switching logic lives in `src/utils/language.ts` and is independent of the translation call itself.

Areas needing verification:

- Whether `VITE_DEFAULT_TARGET_LANGUAGE_CODE` and voice-triggered language switching (`detectLanguageChangeCommand`) are actually wired into `useTranscriptWebSocket.ts` today, since the hook currently hardcodes `TRANSLATION_LANGUAGES` to English + Spanish.
- Exact Groq model support/pricing and whether the model name should be configurable via env var instead of hardcoded.
- Deployment pipeline specifics (Cloudflare Pages project settings, per-client env var management).
- Automated test setup — none currently exists in the repo.

## 2. Getting Started

### Prerequisites

- **Node.js** and **npm** installed
- A **[Recall.ai](https://recall.ai)** API key (to spin up a bot that joins a meeting)
- A **Groq API key** (`VITE_GROQ_API_KEY`) for translation calls (note: the README currently references a Google Translate API key, but the code in `src/utils/translate.ts` actually calls the **Groq** chat completions API — see "Areas needing verification" above)
- **[ngrok](https://docs.recall.ai/docs/local-webhook-development)** for exposing your local dev server to a real Recall.ai bot

### Installation

From the repository root:

```sh
npm install
```

### Environment Setup

Copy the example env file and fill in required values:

```sh
cp .env.example .env
```

Known environment variables (see `src/utils/translate.ts` and `src/config/theme.ts`):

| Variable | Purpose | Required |
|---|---|---|
| `VITE_GROQ_API_KEY` | Groq API key used for translation requests | Yes |
| `VITE_DEFAULT_TARGET_LANGUAGE_CODE` | Default target language code (see `LanguageCode` enum in `src/utils/language.ts`) | No — referenced in README/theme, needs verification it's actually consumed by the translation hook |
| `VITE_CLIENT_NAME` | Per-client display name shown in the header | No (defaults to "Real-Time Translator") |
| `VITE_LOGO_URL` | Per-client logo image path/URL | No (defaults to `/logos/default.png`) |
| `VITE_PRIMARY_COLOR` / `VITE_SECONDARY_COLOR` | Per-client theme colors | No |

> Do not commit real secret values. `.env.example` should be kept up to date with any new variables (note: `.env.example` is protected from direct read/edit via tooling in this environment — edit it manually).

### Basic Usage

```sh
npm run dev      # Start Vite dev server (default port 3000, see vite.config.ts)
npm run build    # Type-check (tsc -b) and build for production
npm run preview  # Preview the production build locally
npm run lint     # Run ESLint
```

To actually test the app end-to-end with a real meeting bot:

1. Start ngrok: `ngrok http --domain {YOUR_NGROK_STATIC_DOMAIN} 3000`
2. Start the dev server: `npm run dev`
3. Start a Google Meet call (`meet.new`)
4. Use the Recall.ai `bot/create` API (see README) with `output_media.screenshare.config.url` set to your ngrok URL, and `recording_config.transcript.provider.meeting_captions` enabled.
5. The bot joins the meeting, renders this app as a screenshare, and streams transcripts to it via WebSocket.

### Running Checks and Tests

```sh
npm run lint
npm run build
```

> **No test framework is currently configured** in this repository (no Jest/Vitest/Playwright config or `test` script in `package.json`). If you add tests, also add the corresponding `npm test` script and update this guide.

## 3. Project Structure

```text
.
├── index.html                        # Vite entry HTML
├── vite.config.ts                    # Vite config (port 3000, "@" alias -> src)
├── tsconfig.json / tsconfig.app.json / tsconfig.node.json
├── eslint.config.js                  # Flat ESLint config (typescript-eslint, react-hooks, react-refresh)
├── package.json                      # Scripts: dev, build, lint, preview
├── .env.example                      # Env var template (protected from tooling read/edit)
├── public/                           # Static assets (e.g., logos)
└── src/
    ├── main.tsx                     # React root render
    ├── App.tsx                      # Top-level layout: header (theme/logo), <Transcript />, footer
    ├── App.css / index.css
    ├── components/
    │   ├── Transcript.tsx           # Renders utterances + translations; auto-scrolls to top on update
    │   └── Transcript.css
    ├── hooks/
    │   └── useTranscriptWebSocket.ts # Core logic: WS connection, reconnect, partial/final buffering,
    │                                 #   translation queue, auto-clear every 60s
    ├── utils/
    │   ├── translate.ts             # Groq API call (translateText), model + prompt config
    │   └── language.ts              # LanguageCode enum, name/alias maps, wake-phrase language detection
    └── config/
        └── theme.ts                 # Reads VITE_CLIENT_NAME/LOGO_URL/COLORS/DEFAULT_TARGET_LANGUAGE_CODE
```

### Main Source Files

- **`src/hooks/useTranscriptWebSocket.ts`** — The heart of the app.
  - Opens a WebSocket to `wss://meeting-data.bot.recall.ai/api/v1/transcript`, with auto-reconnect every 3s (`RECONNECT_RETRY_INTERVAL_MS`) on close/error.
  - Tracks partial (`is_final: false`) vs. final utterances per `original_transcript_id`, keyed in a `Map` so multiple speakers can have concurrent partials.
  - On finalization, immediately renders the original text and enqueues a translation task (`finalQueue`) processed serially via `processQueue()`.
  - Currently hardcodes `TRANSLATION_LANGUAGES` to **English + Spanish** (see "Areas needing verification").
  - Auto-clears all utterances every 60s (`CLEAR_INTERVAL_MS`) and caps history at `MAX_UTTERANCES` (10).

- **`src/utils/translate.ts`** — Calls the Groq chat completions API (`openai/gpt-oss-20b` model) with a system prompt instructing strict translation-only behavior. Has a 3s timeout (`TRANSLATION_TIMEOUT_MS`) via `AbortController`, and falls back to returning the original text on any error so the UI never gets stuck on "(Translating...)".

- **`src/utils/language.ts`** — Defines the full `LanguageCode` enum (Google Translate language codes) and `languageNameMap`. Also implements:
  - `getLanguageCodeByName()` — fuzzy-match a language name/alias to a code.
  - `detectLanguageChangeCommand()` — detects wake phrases ("Hey Translator", "Hey Traductor", "Hey Proxy") followed by a language name in transcript text, for voice-driven language switching. **Not currently called from `useTranscriptWebSocket.ts`** — appears to be a built-but-unwired feature.
  - `findLanguageInText()` — underlying language-name search helper.

- **`src/components/Transcript.tsx`** — Consumes `useTranscriptWebSocket`, renders each utterance's original text + translation lines side-by-side, force-scrolls to top on every update (triple-guarded via sync/rAF/setTimeout), and shows a color-coded language legend.

- **`src/config/theme.ts`** — Per-client theming from env vars (`VITE_CLIENT_NAME`, `VITE_LOGO_URL`, `VITE_PRIMARY_COLOR`, `VITE_SECONDARY_COLOR`, `VITE_DEFAULT_TARGET_LANGUAGE_CODE`), intended for multi-tenant deployment via Cloudflare Pages per the inline comment.

### Important Configuration Files

- **`package.json`** — Scripts: `dev` (vite), `build` (`tsc -b && vite build`), `lint` (eslint .), `preview` (vite preview). Dependencies are minimal: `react`, `react-dom`, `dotenv`. No routing library, no state management library, no CSS framework beyond plain CSS.
- **`tsconfig.json`** — References `tsconfig.app.json` (app source) and `tsconfig.node.json` (Vite config itself).
- **`vite.config.ts`** — Dev server on port 3000; `@` path alias resolves to `src/` (used throughout via `@/utils/...`, `@/hooks/...`, `@/components/...`, `@/config/...`).
- **`eslint.config.js`** — Flat config using `typescript-eslint` recommended rules, `eslint-plugin-react-hooks` recommended rules, and `eslint-plugin-react-refresh` (warns on non-component exports, allows constant exports).
- **`.env.example`** — Template for required env vars; protected from direct tool read/edit in this environment — edit manually in your editor.

### Continue Rules

This file lives at:

```text
.continue/rules/CONTINUE.md
```

Continue will automatically load it into context when working in this repository.

You can add more localized rules files later, for example:

```text
src/services/rules.md
src/components/rules.md
tests/rules.md
```

Use those for component-specific conventions and domain knowledge.

## 4. Development Workflow

### Recommended Workflow

1. Pull the latest changes:
   ```sh
   git pull
   ```

2. Create a focused branch:
   ```sh
   git checkout -b fix/short-description
   ```

3. Install dependencies if needed:
   ```sh
   npm install
   ```

4. Make the change.

5. Run validation:
   ```sh
   npm run lint
   npm run build
   ```

6. Manually verify affected behavior end-to-end (see "Basic Usage" above — requires ngrok + a real Recall.ai bot, since there's no way to simulate the transcript WebSocket locally without one).

7. Review the diff:
   ```sh
   git diff
   git status
   ```

8. Commit and push:
   ```sh
   git add .
   git commit -m "Describe the change"
   git push
   ```

### Coding Standards

Use the repository's existing style as the source of truth (plain functional React components, hooks-based state, minimal external dependencies).

General guidance:

- Prefer explicit types for exported functions/hooks (see `TranslationLine`, `Utterance`, `Transcript` interfaces in `useTranscriptWebSocket.ts` as examples).
- Keep translation/provider concerns isolated in `src/utils/translate.ts` — don't leak Groq-specific request/response shapes into components or the hook.
- Never hardcode API keys; always read from `import.meta.env.VITE_*`.
- Centralize the Groq model name as a named constant in `translate.ts` rather than an inline string literal, to make future upgrades easier.
- Keep the fail-soft error handling pattern in `translateText()` (return original text on failure) unless deliberately changing that UX tradeoff.
- Preserve existing ESLint conventions (flat config, `typescript-eslint` + `react-hooks` + `react-refresh` rules) — run `npm run lint` before committing.

### Testing Approach

**No automated test framework currently exists in this repo.** If adding one, Vitest is a natural fit given the Vite-based toolchain.

Suggested test priorities if/when tests are added:

- **`src/utils/language.ts`** — pure functions, easiest to unit test:
  - `getLanguageCodeByName()` with exact names, aliases, and unknown input
  - `detectLanguageChangeCommand()` with valid wake phrases, missing wake phrases, and wake phrase without a recognizable language
  - `findLanguageInText()` edge cases (partial word matches, accented characters)
- **`src/utils/translate.ts`** — mock `fetch` to test:
  - Successful translation response parsing
  - Non-OK HTTP response → falls back to original text
  - Timeout/abort → falls back to original text
  - Very short text (≤3 chars) → skipped/returned unchanged without a network call
- **`src/hooks/useTranscriptWebSocket.ts`** — more involved; would need a mocked WebSocket (e.g., `mock-socket` or a manual `WebSocket` stub) to test partial→final transitions, the serial translation queue ordering, and the 60s auto-clear/`MAX_UTTERANCES` cap.

Manual verification (current approach) requires a real Recall.ai bot + ngrok tunnel, as described in "Basic Usage."

### Build and Deployment

Before deployment:

```sh
npm run lint
npm run build
```

This project is a static SPA (Vite build output in `dist/`), so "deployment" means publishing the built static assets — comments in `src/config/theme.ts` indicate **Cloudflare Pages** as the intended host, with per-client env vars (`VITE_CLIENT_NAME`, `VITE_LOGO_URL`, etc.) configured per Pages project/environment.

Deployment details needing verification:

- Exact Cloudflare Pages project name(s)/branch-to-environment mapping
- Whether each client gets a separate Pages project or a single project with multiple environments
- Whether `VITE_GROQ_API_KEY` is shared across clients or per-client
- Rollback procedure (Cloudflare Pages supports rollback to previous deployments via its dashboard)

## 5. Key Concepts

### Utterance (Partial vs. Final)

Recall.ai streams transcript messages over the WebSocket as they're spoken. Each message has `transcript.is_final`:

- **Partial (`is_final: false`)** — an in-progress utterance that may still change as more words are recognized. Rendered immediately as original text only, with no translation, keyed by `original_transcript_id` in the `currentUtterances` Map.
- **Final (`is_final: true`)** — the utterance is complete. It's moved into `finalizedUtterances` immediately (original text shown right away) and a translation task is pushed onto the serial `finalQueue`.

Each utterance carries a `sortKey` (assigned in order of first appearance via `transcriptOrderRef`/`nextTranscriptOrderRef`) so multiple speakers' utterances remain in the correct conversational order even though partials/finals for different speakers can interleave.

### Translation Queue

Because the Groq API can take time to respond, and multiple speakers may finalize utterances close together, `useTranscriptWebSocket.ts` processes finalized utterances through a **serial async queue** (`finalQueue` + `processQueue()`), translating one final utterance (across all target languages, in parallel via `Promise.all`) before starting the next. This avoids flooding the API and helps preserve translation order matching speech order.

### Translation Languages / `TranslationLine`

A `TranslationLine` = `{ language, label, text, color }`. `TRANSLATION_LANGUAGES` in `useTranscriptWebSocket.ts` currently hardcodes English (`#60a5fa`) and Spanish (`#facc15`) as the two target languages shown for every utterance. Each finalized utterance gets its own copy of these lines (via `getTranslationLines()`), populated asynchronously as `translateText()` resolves per language.

### `LanguageCode` Enum and Wake-Phrase Detection

`src/utils/language.ts` defines a `LanguageCode` enum mirroring Google Translate's supported language codes, plus a `languageNameMap` for display names and a small `languageAliases` map for fuzzy/bilingual matching (e.g., "francés" → French). It also implements (currently unused by the hook) wake-phrase detection intended to let a speaker say "Hey Translator, switch to French" mid-meeting to change target languages — see `detectLanguageChangeCommand()`.

### Translation Provider (Groq, not Google Translate)

Despite the `LanguageCode` enum being sourced from Google Translate's docs and the README mentioning `VITE_GOOGLE_TRANSLATE_API_KEY`, the actual translation call in `src/utils/translate.ts` uses **Groq's OpenAI-compatible chat completions endpoint** with the `openai/gpt-oss-20b` model and a strict system prompt (translate-only, no commentary, preserve tone/punctuation). This mismatch between docs and code should be reconciled — see "Areas needing verification."

### Fail-Soft Translation Errors

`translateText()` never throws to the caller — on timeout (3s), non-OK HTTP response, or any exception, it logs the error and returns the **original, untranslated text** as a fallback. This ensures the UI never gets stuck showing "(Translating...)" indefinitely, at the cost of silently showing untranslated text on failure.

### Per-Client Theming

`src/config/theme.ts` reads `VITE_CLIENT_NAME`, `VITE_LOGO_URL`, `VITE_PRIMARY_COLOR`, `VITE_SECONDARY_COLOR`, and `VITE_DEFAULT_TARGET_LANGUAGE_CODE` from env vars, defaulting to generic "Real-Time Translator" branding. The inline comment indicates this is meant to support multiple client deployments (e.g., different Cloudflare Pages projects/environments) with different branding.

### Configuration and Secrets

- `VITE_GROQ_API_KEY` is read client-side via `import.meta.env` and sent as a Bearer token directly from the browser to Groq's API — this is inherent to the static-SPA architecture (there's no backend proxy), so treat this key as exposed to anyone who can inspect the deployed app's network requests/bundle.
- Do not commit secrets; keep `.env.example` current (edit it manually, since tooling blocks reading/editing it directly).
- Fail fast / fail soft: currently there's no startup validation if `VITE_GROQ_API_KEY` is missing — requests will simply fail and fall back to untranslated text. Consider adding an explicit check/warning if this key is unset.

## 6. Common Tasks

### Add a New Target Translation Language

1. Confirm the language exists in `LanguageCode` / `languageNameMap` in `src/utils/language.ts` (most Google Translate-supported languages are already present).
2. Add an entry to `TRANSLATION_LANGUAGES` in `src/hooks/useTranscriptWebSocket.ts`:
   ```typescript src/hooks/useTranscriptWebSocket.ts
   const TRANSLATION_LANGUAGES: TranslationLine[] = [
       // ... existing languages ...
       {
           language: LanguageCode.French,
           label: languageNameMap[LanguageCode.French],
           text: "",
           color: "#34d399", // pick a distinct color
       },
   ];
   ```
3. Run `npm run lint` and `npm run build` to confirm no type errors.
4. Manually verify with a real Recall.ai bot (see "Basic Usage") that the new language column appears and gets translated text.
5. Commit:
   ```sh
   git add .
   git commit -m "Add <Language> as a translation target"
   ```

### Change or Upgrade the Groq Model

1. Open `src/utils/translate.ts` and locate the `model: "openai/gpt-oss-20b"` line inside the `fetch` request body.
2. Confirm the replacement model is supported by Groq's chat completions endpoint (check Groq's model docs).
3. Consider extracting the model name into a named constant (e.g., `const GROQ_MODEL = "..."`) if not already done, per the coding standards above.
4. Run checks:
   ```sh
   npm run lint
   npm run build
   ```
5. Manually test a real translation via a Recall.ai bot session and confirm output quality/latency.
6. Commit:
   ```sh
   git add .
   git commit -m "Update Groq model used for translation"
   ```

### Wire Up Voice-Driven Language Switching

The `detectLanguageChangeCommand()` function in `src/utils/language.ts` is implemented but not currently called anywhere in `useTranscriptWebSocket.ts`. To wire it up:

1. In `handleTranscriptMessage` (inside `useTranscriptWebSocket.ts`), call `detectLanguageChangeCommand(originalText)` on finalized transcripts before/instead of queuing a translation.
2. If a language code is detected, update the active target languages (e.g., convert `TRANSLATION_LANGUAGES` from a module-level constant into `useState` so it can change at runtime).
3. Consider whether switching should *add* a language or *replace* the current set — the function's docstring examples show both "add Japanese" and "switch to Hindi" phrasing, so you may want additional parsing to distinguish intent.
4. Test with the wake phrases: "Hey Translator", "Hey Traductor", "Hey Proxy".
5. Run `npm run lint` and `npm run build`, then verify manually with a real bot session.

### Add a New Per-Client Theme Variable

1. Add the variable to `src/config/theme.ts`:
   ```typescript src/config/theme.ts
   export const theme = {
     // ... existing fields ...
     newField: import.meta.env.VITE_NEW_FIELD || "default-value",
   };
   ```
2. Reference `theme.newField` in `App.tsx` or wherever needed.
3. Document the new `VITE_*` variable in this guide's env var table and manually add it to `.env.example` (tooling cannot edit this file directly).
4. Update the Cloudflare Pages environment configuration for each client that needs a non-default value.

### Investigate a Translation Failure

1. Open browser dev tools and check the Network tab for requests to `api.groq.com` — look at status codes and response bodies.
2. Check the browser console for `[translateText] Request failed` or `Error translating text:` log lines (see `src/utils/translate.ts`).
3. Confirm `VITE_GROQ_API_KEY` is set correctly in the running environment (remember: it must be set at *build* time for Vite to inline it, not just at runtime).
4. Confirm the model name (`openai/gpt-oss-20b` or whatever it's been changed to) is still valid/available on Groq.
5. Remember the fail-soft behavior: on any failure, the UI silently shows the original untranslated text rather than an error — so "translation isn't working" may look like nothing happened rather than showing an explicit error.
6. Run `npm run lint` and `npm run build` to rule out local code issues.

## 7. Troubleshooting

### Lint or TypeScript Check Fails

- Read the first error carefully; later errors may be cascading.
- Confirm dependencies are installed.
- Confirm the correct Node.js version is active.
- Run the formatter if one is configured.
- Avoid suppressing TypeScript errors unless there is a documented reason.

### Build Fails

- Check whether required environment variables are needed at build time.
- Confirm imports and path aliases match `tsconfig.json`.
- Make sure generated files, if any, are present.
- Run a clean install if dependency state looks inconsistent:
  ```sh
  rm -rf node_modules
  npm install
  ```

### Groq API Returns a Model Error

Likely causes:

- Incorrect model identifier (`openai/gpt-oss-20b` in `src/utils/translate.ts`, or whatever it's been changed to)
- Model not available to the Groq account
- Model does not support the chat completions endpoint
- `VITE_GROQ_API_KEY` invalid, expired, or missing (check it was set at build time, not just runtime)

Suggested fix:

1. Verify the model name against Groq's model documentation.
2. Confirm the value used in `src/utils/translate.ts`.
3. Run `npm run lint` and `npm run build`.
4. Re-test with a real Recall.ai bot session (see "Basic Usage").
5. Check the browser console/network tab for the actual Groq response body — `translateText()` logs `[translateText] Request failed` with `status`, `statusText`, and `errorBody`.

### WebSocket Never Connects / No Transcripts Appear

- Confirm the app is actually being loaded by a real Recall.ai bot as a screenshare (there's no way to simulate the Recall.ai transcript WebSocket locally without one).
- Check the browser console for "Connected to WebSocket server" vs. repeated "WebSocket closed. Attempting to reconnect..." messages (reconnect runs every 3s — `RECONNECT_RETRY_INTERVAL_MS`).
- Confirm `recording_config.transcript.provider.meeting_captions` was set in the `bot/create` API call (see README) — without this, Recall.ai won't produce transcripts to stream.
- Confirm the ngrok tunnel is still active and its URL matches what was passed to `output_media.screenshare.config.url`.

### Translations Never Appear (Stuck on "(Translating...)")

This should not happen due to the fail-soft design in `translateText()` (it always resolves with either the translation or the original text within ~3s), but if it does:

- Confirm the finalized utterance actually reached the `finalQueue` — add a temporary `console.log` in `handleTranscriptMessage`/`translateFinalUtterance` in `useTranscriptWebSocket.ts`.
- Confirm the queue isn't stuck — `processQueue()` uses an `isProcessingQueue` flag; if a promise never resolves/rejects, the queue could stall (verify `translateText()`'s `AbortController` timeout is firing as expected).

### Translation Works Locally but Fails After Deployment

Check:

- `VITE_GROQ_API_KEY` and other `VITE_*` vars are set in the Cloudflare Pages (or other host) build environment — remember these are inlined at **build time**, so changing them requires a rebuild/redeploy, not just a restart.
- The deployed URL is reachable by Recall.ai's bot infrastructure (no auth wall, no IP restrictions).
- Browser console/network errors on the deployed instance (open the deployed URL directly in a browser tab to debug outside of a live meeting).

## 8. References

- Project README: `README.md` (note: contains some outdated references to Google Translate; actual provider is Groq — see "Translation Provider (Groq, not Google Translate)" above)
- Package scripts and dependencies: `package.json`
- TypeScript configuration: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`
- Vite configuration: `vite.config.ts`
- ESLint configuration: `eslint.config.js`
- Environment example: `.env.example` (edit manually; protected from tooling read/edit)
- [Recall.ai documentation](https://docs.recall.ai/) — bot creation, transcript API, output media/screenshare, regions
- [Groq API documentation](https://console.groq.com/docs) — chat completions endpoint, supported models
- [Google Translate language codes](https://cloud.google.com/translate/docs/languages) — source for the `LanguageCode` enum in `src/utils/language.ts`
- Deployment dashboard (Cloudflare Pages project): needs verification
- Issue tracker / project board: needs verification

## Maintenance Notes

Keep this guide updated when:

- The translation provider or model changes
- New environment variables are added
- Build/test/deployment commands change
- Source directories are reorganized
- New architectural conventions are introduced

For more specific guidance, add `rules.md` files inside relevant subdirectories. Continue can use those files to provide more focused context for that part of the codebase.