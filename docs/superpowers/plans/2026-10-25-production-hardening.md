# Production hardening implementation plan

> **For agentic workers:** Use superpowers:executing-plans; implement and verify each task with regression tests before continuing.

**Goal:** Address every finding from the security review without connecting to Facebook or deploying.

**Architecture:** Keep CommonJS and the personal-account Messenger adapter. Separate validated configuration, message admission/command policy, bounded dispatch, service integrations and durable storage. Use built-in SQLite for reminders and links, expose only `public/` via the web server.

**Tech stack:** Node >=22.16 (Node 24 LTS recommended), node:test, node:sqlite, PHP 8 for the optional redirect endpoint.

**Spec:** The seven findings and remediation recommendations in this chat, approved by the user with “ok rob wszystko”. Implementation choices below are the agent's choices.

## Global constraints

- Preserve command names and right-to-left command pipelines; accept legacy configuration on migration.
- No live Facebook login/messages, deployment, or edits to existing secrets.
- Fail closed: private messages require explicit sender allowlist; administrative commands require configured admins; downloads require explicit permission.
- Node >=22.16; no shell interpolation; HTTPS-only validated external URLs; no raw message/error logging.
- Limits: 4 commands, 10000 input characters, 2 concurrent messages, 20 queued, 10 requests/user/minute, 60 requests/global/minute; configurable positive bounded values.
- Reminders use UUIDs, transactions, leases, acknowledgement, bounded retries, and explicit at-least-once semantics.
- Replace heavy/obsolete service wrappers where practical. Wolfram returns plaintext instead of spawning image tools. Keep documented residual risk of the archived personal-account adapter; do not disguise it as an official integration.

## Review focus

- Malformed/error events and rejected providers must not escape the message boundary.
- Shell payloads, non-YouTube URLs and playlist responses must not launch arbitrary commands or crash.
- Duplicate deliveries, same-time reminders, process restart and ambiguous send failures must not silently lose jobs.
- Authorization must precede service invocation and logging; quoted private content must not leak to logs.
- Migration must preserve legacy files, reject invalid records, and be idempotent.

## Tasks

### 1. Safe configuration, storage and reminder semantics
Files: `utils/config.js`, `utils/storage.js`, `utils/reminder-time.js`, `services/set_job.js`, `utils/job-checker.js`, `scripts/migrate.js`, `tests/storage.test.js`.
Interfaces: validated config object; `Storage` with link/job/migration methods; `parseReminderTime(input, now)`; scheduler awaiting send acknowledgement.
- [x] Write/run failing tests for duplicate timestamps, persistence, leases/retry, invalid time units and legacy migration.
- [x] Implement SQLite storage, deterministic time parser, config defaults/validation and migration.
- [x] Verify full test suite.

### 2. Message boundary, command policy and bounded execution
Files: `utils/listener.js`, `utils/bot-response.js`, `utils/send-msg.js`, `utils/dispatcher.js`, `utils/logger.js`, `services/_service-guess.js`, `tests/dispatcher.test.js`.
Interfaces: `createDispatcher({config, execute, send, logger})`; parser returning commands/content; promise-based send wrapper; metadata-only logs.
- [x] Write/run failing tests for denied DM/group, self-events, errors, rate/concurrency limits, duplicate delivery, quote pipelines and admin-only commands.
- [x] Implement boundary, queue, authorization and transport lifecycle.
- [x] Verify full test suite.

### 3. Secure external services and dependency cleanup
Files: `services/*.js`, `services/nlp/summarize.js`, `services/wolfram/*`, `utils/http.js`, `utils/download-file.js`, `package.json`, `tests/services.test.js`.
Interfaces: service `async (command, content, api, message, context) -> string|null`; bounded fetch; `yt-dlp` executed without shell.
- [x] Write/run failing tests for URL attacks, malformed/empty results, network errors, payload bounds and provider failures.
- [x] Replace detached callbacks, remove unused vulnerable packages, update and audit remaining dependencies; preserve safe transport compatibility.
- [x] Verify tests and adapter load/HTTP/cookie compatibility offline.

### 4. Deployment boundary, documentation and final verification
Files: `public/index.php`, deployment configuration, install/update scripts, README, CI tests.
- [x] Test web endpoint with temporary synthetic data; verify secret URLs are inaccessible under documented docroot.
- [x] Add migration/setup/deployment instructions, secure permissions and reproducible installation.
- [x] Run tests, lint/syntax checks, npm audit and independent code review; fix substantive findings and record limitations.

## Progress / decisions

- Baseline: clean checkout `050f659`; npm test is a failing placeholder, reproduced during review.
- User authorized the complete remediation; proceed inline without repeating design approval. Work in the existing checkout, leave changes reviewable and uncommitted; no deployment or Facebook traffic.

- Task 1: complete — SQLite persistence, atomic idempotent imports, same-time reminders, UTC calendar units, retry leases and delivery acknowledgement verified.
- Task 2: complete — closed-by-default DM policy, group/admin permissions, bounded pipeline/queue, rates, self/error events and private error containment verified.
- Task 3: complete — shell-free restricted YouTube subprocess, bounded HTTPS providers, plaintext Wolfram, local summary; removed native image tooling and obsolete wrappers. Remaining adapter dependency overrides pass cookie/HTML compatibility checks. Audit reports zero known vulnerabilities.
- Task 4: complete — PHP handler and live loopback HTTP checks, secure setup and migration tests, nginx/systemd/PM2 examples, CI and operator documentation.
- Final review: four findings fixed with regression tests: completed-message receipt ordering (including subprocess restart), mention prefix offsets, UTF-16-safe bounded output, persistent link quota with direct-URL fallback. Suite: 35 passing.
- Ruling: retain archived personal-account Facebook adapter with maintained dependency substitutions — official Page API does not meet the requested personal-account/group model; actual protocol compatibility still requires a dedicated-account smoke test before deployment.
- Ruling: return Wolfram plaintext and use local extractive summarization — removes unsafe/obsolete image and math dependencies; image-only results are unavailable and summary wording may differ.
- Ruling: keep current checkout uncommitted and do not deploy/login — user authorized implementation; production credentials and host configuration are not available in this checkout.
- Limits: no live Facebook/provider verification, no target nginx/Apache/PHP-FPM deployment verification; input queue is volatile, durable deduplication covers successfully handled messages and reminder creation, not exactly-once external side effects.
