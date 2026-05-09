# Local Manual Test Readiness

Goal: make the app ready for a real local end-to-end manual test with real LLM calls, account creation, login, CV upload, application generation, editor review, cover letter generation, and PDF download.

## Target Manual Flow

The local manual test should cover this path:

1. Start Postgres and Redis locally.
2. Run Prisma migrations.
3. Start backend.
4. Start frontend.
5. Register a new user.
6. Verify the user's email.
7. Log in.
8. Upload a CV PDF/DOCX.
9. Start a new application from the dashboard.
10. Paste a job ad.
11. Generate optimized CV and cover letters with the real LLM provider.
12. Open the editor.
13. Confirm ATS/match score, optimized CV, cover letter variants, and match report.
14. Edit CV/letter text and save.
15. Download the generated PDF.
16. Test GDPR export and account deletion.

## Tasks To Do Before Starting The Manual-Test Fixes

These are setup/preparation tasks to complete before implementing the P0 readiness fixes or attempting the full manual test.

### A. Decide the local test scope

Task:
- Confirm the first manual test scope is:
  - account registration
  - email verification
  - login
  - CV upload
  - text-only job ad input
  - real LLM CV/job parsing
  - real LLM optimization
  - real LLM cover letter generation
  - editor review and save
  - single PDF download
  - GDPR export/delete
- Mark these as out of scope for the first local test unless explicitly needed:
  - Paddle checkout
  - email-to-self PDF attachments
  - ZIP export with all layouts
  - URL/screenshot/PDF job parsing
  - production deployment

### B. Choose the LLM provider for local testing

Recommended:
- Use `AI_PROVIDER=mistral`.
- Use a real Mistral API key.

Task:
- Create or obtain the Mistral API key.
- Confirm the key is allowed to call the selected chat model.
- Decide the local test model name if different from the current default `mistral-small-latest`.
- Keep Claude disabled for CV/Art. 9 data unless the legal/provider decision changes.

### C. Prepare local secrets

Task:
- Create a local backend env file or shell profile with all required secrets.
- Do not commit it.
- Generate a local JWT private key.
- Generate a local IP salt.
- Decide whether Resend will be real or bypassed in dev.

Required local values:
- `DATABASE_URL`
- `REDIS_URL`
- `JWT_PRIVATE_KEY`
- `IP_SALT`
- `APP_URL`
- `AI_PROVIDER`
- `MISTRAL_API_KEY`
- `RESEND_API_KEY` or a dev-only verification path
- `MAIL_DOMAIN`

### D. Prepare local infrastructure

Task:
- Confirm Docker Desktop is running.
- Confirm ports are free:
  - Postgres: `5432`
  - Redis: `6379`
  - Backend: `3000`
  - Frontend: `4200`
- Decide whether Redis local test uses no password or a passworded URL.
- If using passworded Redis, make sure `REDIS_URL` includes it.

### E. Prepare test data

Task:
- Prepare one small valid PDF CV.
- Prepare one small valid DOCX CV.
- Prepare one invalid upload file for negative testing.
- Prepare one realistic German job ad as plain text.
- Prepare one realistic English job ad as plain text if testing language behavior.
- Keep all test CVs fake or anonymized.

### F. Confirm database state strategy

Task:
- Decide whether each manual test starts from a fresh database.
- If yes, document the reset command separately and use it only intentionally.
- Confirm the initial Prisma migration exists before testing against a fresh database.

### G. Add a local AI smoke-test command

Task:
- Add a small backend smoke script or Jest integration test that calls the real provider with fake/anonymized data.
- It should verify:
  - `parseCv` returns `ParsedCV`
  - `parseJob` returns `ParsedJob`
  - `optimizeCv` returns valid optimized CV JSON
  - `generateCoverLetter` returns all variants
- Keep it opt-in so normal unit tests do not spend LLM tokens.

### H. Decide what to do with incomplete features during testing

Task:
- Disable or hide UI paths for features not included in the first manual test.
- Or clearly document that they are known incomplete.

Recommended for first local test:
- Keep editor single PDF download.
- Hide/skip ZIP export.
- Hide/skip email-to-self.
- Keep job input text-only.
- Skip Paddle.

## P0 - Must Fix Before Manual Test

### 1. Add the missing wizard route

Current issue: dashboard buttons link to `/app/wizard`, but `frontend/src/app/app.routes.ts` has no `wizard` child route.

Task:
- Add `{ path: 'wizard', loadComponent: () => import('./features/wizard/wizard.component').then(m => m.WizardComponent) }` under the protected `/app` children.
- Add/update route or dashboard tests.
- Verify dashboard "Neue Bewerbung" opens the wizard instead of 404.

### 2. Make local email verification testable

Current issue: registration sends a Resend verification email. Without real Resend/domain setup, login is blocked by `emailVerifiedAt`.

Choose one local testing path:
- Preferred local dev path: log verification token to backend console in development.
- Alternative: add a dev-only endpoint to verify latest test user.
- Production path: configure real `RESEND_API_KEY`, `MAIL_DOMAIN`, and `APP_URL`.

Task:
- Decide and implement one local verification approach.
- Ensure it is gated by `NODE_ENV !== 'production'` if it bypasses email.

### 3. Create and apply the initial Prisma migration

Current issue: `backend/prisma/migrations` is missing.

Task:
- Ensure local `DATABASE_URL` is set.
- Run initial migration.
- Commit/store the generated migration files.
- Confirm `npm run prisma:deploy` works against a fresh database.

### 4. Fix the AI worker topology

Current issue:
- `infra/docker-compose.yml` starts `node dist/worker.js`, but no `src/worker.ts` exists.
- `AiPipelineProcessor` is imported by the normal API app, so the API process also consumes jobs.

Task:
- Split queue producer and queue worker:
  - API imports only queue producer/enqueue service.
  - Worker imports the BullMQ processor.
- Add `backend/src/worker.ts`.
- Ensure build outputs `dist/worker.js`.
- Add `npm run start:worker` script if useful.
- Verify one API process enqueues and one worker process consumes.

### 5. Validate required environment variables at boot

Current issue: missing keys fail later with unclear errors.

Task:
- Add backend env validation for:
  - `DATABASE_URL`
  - `REDIS_URL`
  - `JWT_PRIVATE_KEY`
  - `IP_SALT`
  - `APP_URL`
  - `AI_PROVIDER`
  - `MISTRAL_API_KEY` when `AI_PROVIDER=mistral`
  - `ANTHROPIC_API_KEY` when `AI_PROVIDER=claude`
  - `RESEND_API_KEY`
  - `MAIL_DOMAIN`
  - `PADDLE_WEBHOOK_SECRET` if testing billing
- Fail fast with a clear startup error.

### 6. Confirm real LLM provider contract

Current state:
- `AiService` supports `mistral` and `claude`.
- Default is Mistral.
- Outputs are Zod-validated.

Task:
- Decide local manual-test provider. Recommended: `AI_PROVIDER=mistral`.
- Set a real `MISTRAL_API_KEY`.
- Run one backend-only smoke test against:
  - `AiService.parseCv`
  - `AiService.parseJob`
  - `AiService.optimizeCv`
  - `AiService.generateCoverLetter`
- Confirm prompts return valid JSON matching schemas.

## P1 - Strongly Recommended Before Manual Test

### 7. Add visible application generation progress

Current issue: application creation enqueues the AI job and redirects to editor, but the editor may load before AI output is ready. SSE progress is currently stubbed.

Task:
- Add a clear pending/generating state to application records or frontend editor.
- Option A: poll `GET /api/applications/:id` until `optimizedCv` and `coverLetter` exist.
- Option B: implement real BullMQ progress SSE.
- Show user-facing loading copy while AI generation runs.

### 8. Unify ATS/match scoring

Current issue:
- Trial scoring checks keywords across more CV text.
- Application scoring only checks `optimizedCv.skills` against `job.skills`.

Task:
- Create a shared backend `MatchScoringService`.
- Weight `mustHaves` higher than general skills.
- Include missing keywords in `matchReport`.
- Use the same scoring service in trial and application pipeline.

### 9. Store a useful match report

Current issue: the pipeline stores `matchScore`, but does not build a rich `matchReport`.

Task:
- Save:
  - summary
  - matched keywords
  - missing keywords
  - strengths
  - risks or suggested improvements
- Ensure editor left panel has meaningful data after generation.

### 10. Guard against AI hallucinations before saving

Current issue: Zod validates shape only. It does not yet check whether optimized claims are grounded in the original CV.

Task:
- Add a skill whitelist check.
- Reject newly invented skills not present in original CV unless clearly inferred from original text.
- Add basic source/citation checks or conservative post-processing.
- Add tests for invented skill rejection.

### 11. Sanitize AI output before editor/PDF

Current issue: AI text is displayed and rendered into PDF without a dedicated sanitization step.

Task:
- Sanitize generated cover letters and CV text before persistence or before rendering.
- Keep output as text where possible.
- Add tests for script/html injection strings.

### 12. Fix accepted-but-unimplemented job input modes

Current issue: backend accepts `url`, `screenshot`, and `pdf`, but throws for them.

For local manual testing, choose one:
- Narrow local UI/API to text-only job ads.
- Or implement URL/PDF parsing before testing those modes.

Task:
- Do not expose input modes that throw at runtime.

## P2 - Optional For First Manual Test

### 13. PDF export scope

Current state:
- Single PDF download from editor exists.
- Multi-layout ZIP export endpoint returns 501.

Task:
- For first manual test, use only editor PDF download.
- Later implement ZIP export with Modern/Clean/Editorial layouts.

### 14. Email-to-self attachments

Current issue: email-to-self sends an informational email only; PDFs are not attached.

Task:
- Skip this in first manual test, or implement in-memory PDF attachment through Resend.

### 15. Paddle local billing

Current issue:
- Price ID is a placeholder.
- CSP blocks external Paddle scripts.
- Webhook signature implementation needs verification against Paddle's real format.

Task:
- Skip billing in first manual test unless specifically testing Paddle sandbox.
- For billing test, configure Paddle sandbox, CSP, price IDs, and webhook verification.

## Local Environment Checklist

Create backend `.env` or equivalent local env with:

```env
DATABASE_URL=postgresql://lba:password@localhost:5432/lba
REDIS_URL=redis://localhost:6379
JWT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
IP_SALT=replace-with-random-local-salt
APP_URL=http://localhost:4200
AI_PROVIDER=mistral
MISTRAL_API_KEY=replace-with-real-key
RESEND_API_KEY=replace-with-real-key-or-dev-mode
MAIL_DOMAIN=localhost
PADDLE_WEBHOOK_SECRET=optional-for-billing-test
```

Frontend local config:

```ts
export const environment = {
  apiUrl: '/api',
  paddlePriceIdPro: 'sandbox-price-id-if-testing-billing',
};
```

## Local Run Sequence

1. Start services:

```bash
cd infra
docker compose up -d postgres redis
```

2. Run migration:

```bash
cd backend
npm run prisma:deploy
```

3. Start backend API:

```bash
cd backend
npm run start:dev
```

4. Start worker, after worker split is implemented:

```bash
cd backend
npm run start:worker
```

5. Start frontend:

```bash
cd frontend
npm start
```

6. Open:

```text
http://localhost:4200
```

## Manual Test Script

### Account

- Register with a fresh email.
- Verify email using the chosen local verification path.
- Log in.
- Hard refresh on `/app` and confirm the session behavior.

### CV Upload

- Upload a valid PDF.
- Upload a valid DOCX.
- Try an invalid file and confirm a user-visible error.
- Confirm no original file is persisted.

### Application Generation

- Click "Neue Bewerbung".
- Select uploaded CV.
- Paste a real job ad with at least 50 characters.
- Generate application.
- Confirm AI job completes.
- Confirm editor shows optimized CV, cover letters, score, and match report.

### Editor

- Edit CV text and blur field.
- Reload editor and confirm change persisted.
- Switch cover letter variants.
- Edit one cover letter and confirm save.
- Mark as sent.

### PDF

- Download PDF.
- Open PDF and confirm it contains the optimized CV content.

### Trial

- Open `/try`.
- Paste CV and job text.
- Confirm real AI response returns score, keywords, and cover letter preview.

### GDPR

- Open billing/settings page.
- Export user data.
- Confirm JSON contains user, master CVs, applications, and consents.
- Delete account with confirmation.
- Confirm login no longer works.

## Done Criteria

Local manual testing is ready when:

- All P0 tasks are complete.
- Backend lint/test/build pass.
- Frontend lint/test/build pass.
- A real Mistral or chosen LLM smoke test passes.
- A fresh local database can run the full account to PDF flow.
- Known incomplete features are hidden, disabled, or clearly marked out of scope for the test.
