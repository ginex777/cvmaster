# AI, Web, and Backend Audit - 2026-05-09

## Verification

- Backend lint: passed with 5 warnings.
- Backend tests: passed, 35 tests.
- Backend build: passed.
- Frontend lint: passed.
- Frontend tests: passed, 75 tests.
- Frontend build: passed.

## Current AI Flow

### Authenticated application flow

1. The user uploads a master CV through `POST /api/cvs`.
2. `CvsService.parseAndStore` validates magic bytes, extracts PDF/DOCX text in memory, calls `AiService.parseCv`, then stores only parsed JSON plus filename/hash metadata.
3. The wizard posts text job ads to `POST /api/jobs/parse`.
4. `JobsService.parse` hashes the text, calls `AiService.parseJob`, then stores the parsed job posting.
5. The wizard posts `masterCvId` and `jobPostingId` to `POST /api/applications`.
6. `ApplicationsService.create` creates a draft application and enqueues `ai-pipeline`.
7. `AiPipelineProcessor` consumes the job, calls `AiService.optimizeCv`, then `AiService.generateCoverLetter`, computes `matchScore`, and updates the application.
8. The editor loads the application from `GET /api/applications/:id`, lets the user edit CV/letter JSON via `PATCH`, and downloads a single PDF through `GET /api/applications/:id/pdf`.

### Anonymous trial flow

1. `/try` posts CV text and job text to `POST /api/trial`.
2. `TrialService.run` calls `AiService.parseCv`, `AiService.parseJob`, `AiService.optimizeCv`, and `AiService.generateCoverLetter` synchronously.
3. The response returns a deterministic score, keywords, and a truncated cover-letter preview.

### Provider selection

- `AiService` chooses the provider from `AI_PROVIDER`.
- Default is `mistral`.
- `AI_PROVIDER=claude` switches to Claude.
- Mistral uses `MISTRAL_API_KEY`.
- Claude uses `ANTHROPIC_API_KEY`.
- Both providers parse JSON and validate the result with Zod schemas.

## Findings And Tasks

### P0 - Wizard route is missing

- Evidence: dashboard links to `/app/wizard`, but `app.routes.ts` has no `wizard` child under `/app`.
- Impact: users cannot start the authenticated application flow from the dashboard; they land on 404.
- Task: add `/app/wizard` route, import `WizardComponent`, and add route tests.

### P0 - Docker worker command points to a missing build artifact

- Evidence: `infra/docker-compose.yml` runs `node dist/worker.js`, but `backend/dist` only contains `main.js` and feature modules.
- Impact: the separate worker container will fail to boot in production.
- Task: add `src/worker.ts`, configure Nest build entry/output, or change deployment to run the existing app worker intentionally.

### P0 - API process also starts the AI worker

- Evidence: `QueueModule` registers `AiPipelineProcessor`; `AppModule` imports `QueueModule`.
- Impact: API instances consume background AI jobs too. With both `api` and `worker`, jobs may be processed by unexpected processes; with multiple API replicas, every API instance becomes a worker.
- Task: split queue producer and queue worker modules. API should only enqueue; worker process should consume.

### P0 - Redis production URL must include password

- Evidence: docker-compose starts Redis with `--requirepass`, while code only consumes `REDIS_URL`.
- Impact: if `REDIS_URL` is not `redis://:<password>@redis:6379`, queue startup fails.
- Task: document and validate `REDIS_URL` at boot; fail fast with a clear message.

### P1 - AI env handling is not launch-safe

- Evidence: `AiService` uses non-null assertions for `MISTRAL_API_KEY` and `ANTHROPIC_API_KEY`.
- Impact: missing keys produce unclear runtime failures.
- Task: add typed env/config validation for AI_PROVIDER and provider keys, including an explicit unsupported-provider error.

### P1 - AI retry loop is generic, not stricter

- Evidence: `withRetry` repeats the same request three times.
- Impact: schema failures may keep failing; the spec expects stricter retry prompts.
- Task: distinguish network errors from schema parse failures and append stricter JSON/schema instructions on retries.

### P1 - Application progress SSE is stubbed

- Evidence: `streamProgress` immediately emits `{ status: "pending" }` and closes.
- Impact: frontend cannot reliably show AI processing status.
- Task: wire BullMQ `QueueEvents` or polling-friendly application status fields; add frontend progress UX.

### P1 - Multi-layout export endpoint is still stubbed

- Evidence: `POST /api/applications/:id/export` returns HTTP 501.
- Impact: only the simple editor PDF download works; spec ZIP/export flow does not.
- Task: implement Modern/Clean/Editorial plus Clean ATS fallback ZIP, or remove/disable the route until complete.

### P1 - Email-to-self sends no attachments

- Evidence: `ApplicationsService.emailToSelf` and `MailService.sendApplicationToSelf` both have TODOs for rendered PDFs.
- Impact: the user receives an informational email, not application documents.
- Task: generate PDFs in memory and attach them through Resend, or adjust UI/API copy to match current behavior.

### P1 - Job URL/screenshot/PDF inputs are advertised in backend schema but unimplemented

- Evidence: `JobsController` accepts `url`, `screenshot`, and `pdf`; `JobsService.fetchText` throws for all three.
- Impact: API returns 500-style errors for accepted input modes.
- Task: either implement URL/PDF/screenshot parsing or narrow accepted schema/UI to text only.

### P1 - Paddle checkout is blocked by current CSP and placeholder price ID

- Evidence: CSP `scriptSrc` and `connectSrc` only allow `'self'`; frontend price id is `pri_pro_monthly_placeholder`.
- Impact: Paddle JS checkout will not load/work in production.
- Task: add Paddle script loading strategy, update CSP for Paddle domains, and replace the placeholder with environment-specific config.

### P1 - Paddle webhook signature likely does not match Paddle's real header format

- Evidence: implementation expects a simple HMAC hex signature over raw body.
- Impact: real Paddle webhook validation may reject legitimate events.
- Task: verify against Paddle's current webhook signature format and use their SDK verifier or compatible parser.

### P2 - Auth/session contract is incomplete after refresh

- Evidence: backend token response returns `{ id, plan }`, while frontend `User` expects email, name, emailVerified, and twoFactorEnabled.
- Impact: authenticated UI may have partial user state after login/refresh.
- Task: align auth DTOs and add frontend/backend tests for login and refresh response shape.

### P2 - No automatic refresh on page reload

- Evidence: `AuthService` stores the access token in a signal only; `authGuard` does not attempt refresh.
- Impact: protected routes redirect to login after a hard reload even if the refresh cookie is valid.
- Task: add app bootstrap/session hydration or an async guard refresh path.

### P2 - Master CV update lacks ownership check

- Evidence: `CvsService.update` updates by id only.
- Impact: a logged-in user could rename/change another user's CV if they know the id.
- Task: use `updateMany` with `{ id, userId }` or first check ownership; add negative tests.

### P2 - TOTP is not enforced

- Evidence: `AuthService.login` contains a TODO for TOTP when `twoFactorEnabled`.
- Impact: 2FA flag currently does not protect login.
- Task: implement TOTP verification or remove the exposed 2FA field until implemented.

### P2 - Prisma migrations are absent

- Evidence: `backend/prisma/migrations` does not exist.
- Impact: production database cannot be provisioned by `prisma migrate deploy`.
- Task: create and commit the initial migration.

### P2 - AI job audit table is not populated

- Evidence: `AiJob` exists in Prisma, but the AI pipeline does not create/update `AiJob` rows.
- Impact: no prompt/response/cost/error audit trail and no 30-day purge value beyond an empty table.
- Task: record each AI pipeline stage with provider/model, prompt version, result/error, and timestamps.

### P2 - LLM output safety checks are incomplete

- Evidence: outputs are Zod-validated, but citation checks, skill whitelist, hallucination checks, and sanitization before editor/PDF are not implemented.
- Impact: optimized CV can introduce unsupported claims or unsafe content.
- Task: add post-processing guards before saving optimized CV and cover letters.

## Recommended Next Sprint Order

1. Fix `/app/wizard` route and dashboard navigation.
2. Split API queue producer from worker consumer and add a real `worker` entry point.
3. Add env validation for AI, Redis, JWT, Resend, Paddle, and app URLs.
4. Implement or disable incomplete endpoints: SSE, ZIP export, email attachments, non-text job parsing.
5. Align auth refresh/user DTO and add session hydration on frontend.
6. Add AI audit rows plus schema-failure retry hardening.
7. Add hallucination/sanitization checks before persistence and PDF rendering.
