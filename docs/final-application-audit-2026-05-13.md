# Final Application Audit - 2026-05-13

This is the current source-of-truth checklist for remaining launch-readiness work after the full repo audit on 2026-05-13.

## Verification Snapshot

- [x] Backend lint passed: `npm run lint` in `backend`.
- [x] Backend tests passed: `npm test` in `backend` (15 suites, 74 tests).
- [x] Backend build passed: `npm run build` in `backend`.
- [x] Backend high-severity npm audit passed: `npm audit --audit-level=high` in `backend`.
- [x] Backend still has moderate Prisma dev-tooling advisories through `@hono/node-server`; the suggested npm force fix downgrades Prisma and should not be applied blindly.
- [x] Frontend lint passed: `npm run lint` in `frontend`.
- [x] Frontend tests passed: `npm test` in `frontend` (34 suites, 110 tests).
- [x] Frontend build passed: `npm run build` in `frontend`.
- [x] Frontend npm audit passed at high and moderate levels.
- [x] Docker Compose config is valid: `docker compose -f infra/docker-compose.yml config --quiet`.
- [x] Docker runtime is up for Caddy, frontend, API, worker, Postgres, and Redis.
- [x] API health through Caddy passed: `GET http://localhost/api/health` returned `{"status":"ok","checks":{"database":"ok","redis":"ok"}}`.
- [x] Public a11y smoke passed: `A11Y_URL=http://localhost npm run a11y --prefix frontend` for `/`, `/preise`, `/try`.
- [x] CV PDF exports use the selected saved CV template.
- [x] Cover-letter and bundle exports now use the same selected template family.
- [x] Official Groq docs list `llama-3.3-70b-versatile` as a current production model with JSON object mode, so the default model id in `backend/src/ai/groq.provider.ts` is not obviously stale as of this audit.

## Critical Open Checklist

### Done - P1 - AI pipeline failures are invisible to users

Evidence:
- `backend/src/queue/ai-pipeline.processor.ts:71` logs BullMQ failures only.
- Failed jobs do not update the `Application` row to a failed/error state.
- `backend/src/applications/applications.service.ts:90` has a stubbed `streamProgress` that emits only `{ status: "pending" }` and closes.

Impact:
- When Groq or another AI provider fails, the user sees a stuck or stale application instead of a recoverable error.
- This is the most likely reason a Groq send error feels opaque in the UI.

DoD:
- [x] Add an application failure status or error field, or a separate job-status record.
- [x] On queue `failed`, persist a sanitized user-facing error and keep provider details in server logs only.
- [x] Expose current job progress/failure through `/applications/:id/stream` or a polling endpoint.
- [x] Frontend editor shows generation progress and failed-state recovery with `aria-live`; the wizard hands off to the editor after queueing.
- [x] Add backend tests for the retry/reset path and verify the full backend suite.
- [x] Add frontend tests for failed generation and retry UX.

Closed in the implementation commit for this task. Verification: backend lint, backend build, backend test suite, frontend lint, frontend build, frontend test suite all passed. SQL migration was also applied successfully to local Postgres with `psql`; the local Prisma CLI still reports a generic schema-engine error when running `migrate deploy`, which is tracked separately if it persists outside this workspace.

### Done - P1 - Client can write server-owned application integrity fields

Evidence:
- `backend/src/applications/applications.controller.ts:24` to `31` accepts `matchReport`, `matchScore`, and `status` in the general PATCH schema.
- `backend/src/applications/applications.service.ts:75` writes the parsed PATCH data directly to Prisma after ownership check.

Impact:
- An authenticated owner can forge match scores, match reports, and lifecycle state.
- Editing CV/letter drafts is legitimate, but AI scoring and workflow state should be server-owned.

DoD:
- [x] Split client-editable draft fields from server-owned fields.
- [x] Keep user-editable `optimizedCv`, `coverLetter`, `chosenVariant`, and `chosenLayout` for manual editing.
- [x] Remove `matchScore`, `matchReport`, and broad `status` writes from the generic PATCH endpoint.
- [x] Keep explicit status transitions behind a validated enum on the dedicated status endpoint.
- [x] Add controller tests proving clients cannot forge score/report/status through the generic PATCH endpoint.

Closed in the implementation commit for this task. Verification: backend lint, backend build, backend application controller/service tests, frontend lint, frontend build, and frontend editor tests passed.

### Done - P1 - Email-to-self endpoint sends no generated PDFs

Evidence:
- `backend/src/applications/applications.service.ts:118` still has `TODO: render PDFs and attach to mail`.
- `backend/src/mail/mail.service.ts:39` still has `TODO: attach rendered PDFs`.

Impact:
- The endpoint reports success but does not deliver the expected application documents.

DoD:
- [x] Render CV and cover letter in memory using the chosen template.
- [x] Attach generated PDFs to the outgoing email.
- [x] Keep all generated files in memory only; do not persist PDFs on disk.
- [x] Add tests proving attachments are passed to the mail provider.
- [x] Add frontend success/error messaging for the actual email action if exposed in UI. The endpoint is backend-only in the current UI, so no frontend change was needed.

Closed in the implementation commit for this task. Verification: backend lint, backend build, and backend application service tests passed.

### Done - P1 - Paddle checkout is not production-ready

Evidence:
- `frontend/src/environments/environment.ts:3` uses `pri_pro_monthly_placeholder`.
- `frontend/src/app/features/pricing/pricing.component.ts:34` assumes `globalThis.Paddle` already exists.
- `backend/src/main.ts:50` and `infra/Caddyfile:11` CSP allow only self scripts/connect sources.

Impact:
- Real checkout will fail unless Paddle is injected outside the Angular app and CSP is changed.

DoD:
- [x] Replace placeholder price id with explicit environment/runtime config; checkout now fails closed until token and price id are configured.
- [x] Load Paddle SDK deliberately from Paddle CDN and initialize sandbox/production mode.
- [x] Update backend Helmet CSP and Caddy CSP for Paddle script/connect/frame domains.
- [x] Verify checkout open behavior through component tests with sandbox config. Real sandbox transaction still requires real Paddle client token, price id, and account credentials.
- [x] Add tests for missing config and configured SDK behavior; existing payment tests cover webhook plan transitions.

Closed in the implementation commit for this task. Verification: frontend pricing tests, frontend lint, frontend build, backend lint, and backend build passed. Paddle integration details were checked against Paddle's current developer docs: https://developer.paddle.com/paddlejs/include-paddlejs

### Done - P1 - Account deletion leaves frontend auth state partially uncleared

Evidence:
- `frontend/src/app/features/billing/billing.component.ts:54` deletes `/gdpr/account`.
- `frontend/src/app/features/billing/billing.component.ts:55` only sets `auth.user` to null.
- `frontend/src/app/core/auth/auth.service.ts:16` keeps the access token in a private signal that billing cannot clear.

Impact:
- After deletion, the UI no longer has a user but the in-memory access token can remain until reload.
- The server also does not clear the refresh cookie on the GDPR delete response.

DoD:
- [x] Add an `AuthService.clearSession()` helper for local token/user cleanup.
- [x] Clear access token, user signal, and refresh cookie after successful account deletion.
- [x] Redirect to a public route after successful account deletion.
- [x] Add frontend tests proving token/user state is cleared.
- [x] Add backend test proving the delete response clears the session cookie.

Closed in the implementation commit for this task. Verification: backend GDPR controller/service tests, backend lint, backend build, frontend billing tests, frontend lint, and frontend build passed.

### Done - P1 - GDPR delete behavior conflicts with soft-delete retention policy

Evidence:
- `backend/src/gdpr/gdpr.service.ts:33` hard-deletes the user immediately.
- `backend/src/gdpr/gdpr.service.ts:39` says soft-deleted users are hard-deleted after 30 days.
- `backend/src/users/users.service.ts:21` soft-deletes users through `deletedAt`.

Impact:
- Two deletion paths have different retention semantics.
- Legal/product expectation is unclear for account deletion versus immediate erasure.

DoD:
- [x] Decide and document user-triggered GDPR deletion as 30-day soft-delete with scheduled hard purge.
- [x] Make `/gdpr/account` consistent with `/users/me` soft-delete behavior.
- [x] Revoke active sessions during deletion and reject soft-deleted users during login/JWT validation.
- [x] Add tests for deletion, session revocation, and soft-deleted login rejection.

Closed in the implementation commit for this task. Verification: backend GDPR/auth tests, backend lint, and backend build passed.

### P1 - Legal/compliance launch pack is still placeholder-level

Evidence:
- `README.md:65` to `69` still lists unchecked DSFA, VVT, TOM, AGB/privacy legal review, and AVV collection.
- Template files exist in `docs/dsfa-template.md`, `docs/vvt-template.md`, and `docs/tom-template.md`, but final signed/approved documents are not present.

Impact:
- This is a launch blocker for a German application processing Art. 9-adjacent CV data and AI providers.

DoD:
- [ ] Complete DSFA.
- [ ] Complete VVT.
- [ ] Complete TOM.
- [ ] Complete AGB and privacy policy lawyer review.
- [ ] Collect AVVs for Mistral/Aleph Alpha, Resend, Paddle, IONOS, Crisp, and any actual AI/email/hosting vendors used.
- [ ] Store final docs separately from templates and link them from README.

## Important Open Checklist

### P2 - Landing-page modal login does not support 2FA

Evidence:
- `frontend/src/app/features/auth/login.component.html:41` includes a 2FA field on the dedicated login page.
- `frontend/src/app/features/landing/landing.component.html:137` to `157` has only email/password in the modal login.
- `frontend/src/app/features/landing/landing.component.ts:119` calls `auth.login()` without a TOTP value.

Impact:
- Users with two-factor authentication enabled can log in on `/login` but not through the landing-page modal.

DoD:
- [ ] Add optional 2FA code field to the landing modal login or route modal login to `/login`.
- [ ] Reuse the same validation semantics as the dedicated login component.
- [ ] Add landing component test for 2FA submission.

### P2 - Protected-route visual/a11y smoke is missing

Evidence:
- `frontend/scripts/a11y-smoke.mjs` only checks public routes by default: `/`, `/preise`, `/try`.
- The app shell, dashboard, CV upload, wizard, editor, and billing routes are not covered by automated visual/a11y smoke.

Impact:
- Public marketing accessibility is verified, but the authenticated UX can regress without a smoke test.

DoD:
- [ ] Add a seeded/authenticated Playwright smoke that logs in or uses a test session.
- [ ] Cover `/app`, `/app/cvs`, `/app/wizard`, `/app/applications/:id`, and `/app/billing`.
- [ ] Include desktop and mobile viewport checks.
- [ ] Keep axe checks and at least one screenshot per protected workflow.

### P2 - Upload security is minimal

Evidence:
- `backend/src/cvs/cvs.service.ts:56` validates only PDF and ZIP magic bytes.
- DOCX validation accepts any ZIP-like file before Mammoth parsing.
- No malware scanning or archive-bomb guard is present.

Impact:
- The product processes sensitive user-uploaded documents. Even RAM-only processing should reject suspicious files before parsing.

DoD:
- [ ] Add size, page/entry, and decompression limits around PDF/DOCX extraction.
- [ ] Validate DOCX structure rather than accepting any ZIP signature.
- [ ] Add optional malware scanning if required by deployment policy, still without persisting uploads.
- [ ] Add tests for invalid ZIP, oversized input, malformed PDF, and valid PDF/DOCX.

### P2 - AI job audit table is not populated

Evidence:
- `backend/prisma/schema.prisma` defines `AiJob`.
- `backend/src/gdpr/gdpr.service.ts:52` purges old AI jobs.
- No create/update calls for `aiJob` were found in AI provider or queue processing code.

Impact:
- Retention cleanup exists, but there is no audit trail for provider calls, failures, durations, or output validation.

DoD:
- [ ] Create an `AiJob` record for every parse/optimize/letter call.
- [ ] Store provider, status, timing, sanitized error category, and retention deadline.
- [ ] Do not store raw sensitive prompts unless the privacy policy explicitly allows it.
- [ ] Include records in GDPR export only if legally appropriate.
- [ ] Add tests around create, fail, complete, and purge paths.

### P2 - Public `/health` is frontend HTML, not service health

Evidence:
- `GET http://localhost/health` returned the Angular index HTML.
- `GET http://localhost/api/health` returned the correct health JSON.

Impact:
- External uptime monitors pointed at `/health` will receive 200 even if API dependencies are down.

DoD:
- [ ] Add a Caddy route for `/health` that proxies to `/api/health`, or document `/api/health` as the only health endpoint.
- [ ] Add a deploy/readiness check that asserts JSON health output.

### P2 - PlanGuard exists but product gates are mostly manual

Evidence:
- `backend/src/common/guards/plan.guard.ts` defines `PlanGuard` and `@RequirePlan`.
- No active route usage of `@RequirePlan` was found.
- Free-plan limit is implemented manually in `ApplicationsService.create`.

Impact:
- This is not broken, but plan enforcement is easy to miss as new premium routes are added.

DoD:
- [ ] Decide whether manual plan checks are the project convention or adopt `PlanGuard`.
- [ ] Apply a consistent pattern to all paid features.
- [ ] Add tests for free, pay-per-app, and pro plan boundaries.

### P2 - Stale audit/readiness documents can confuse future work

Evidence:
- `docs/ai-web-backend-audit-2026-05-09.md` and `docs/local-manual-test-readiness.md` contain older findings, some now fixed and some still open.
- `docs/superpowers/plans/` is empty, but old spec checklists still contain unchecked implementation markers.

Impact:
- Future agents may re-open already completed work or miss the new final checklist.

DoD:
- [ ] Mark old audit/readiness docs as superseded by this file or archive them.
- [ ] Keep only one active open-task checklist.
- [ ] Remove completed checklist items once their DoD is verified and committed.

## Notes On Verified Wiring

- Auth guard wiring exists on protected backend controllers (`auth`, `users`, `cvs`, `jobs`, `applications`, `gdpr`) and ownership checks are applied for application export/regenerate/email/status routes.
- CV upload and job parsing are user-scoped by `userId`.
- Master CV template selection is persisted and included in CV listing.
- CV, cover-letter, and bundle PDF exports all use the selected template family.
- The Docker worker starts separately from the API and the API logs show expected routes mapped.
- Frontend Angular conventions look broadly aligned: standalone components, `ChangeDetectionStrategy.OnPush`, singular `styleUrl`, block control flow, reactive forms, and aria-live regions are present in the main smart components.

## Groq-Specific Finding

The configured default Groq model id `llama-3.3-70b-versatile` is listed by official Groq documentation as a production model with JSON object mode. If users still see Groq errors, the next debugging target should be the exact provider response, schema-validation failure, API key/quota/rate limit, or network/runtime environment. The current application does not persist or show those failures clearly, which is covered by the P1 AI pipeline failure item above.

Source checked: https://console.groq.com/docs/models
