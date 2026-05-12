# Workflow Audit Tasks - 2026-05-12

Audit scope: frontend, backend, infra, CI, app-shell/post-login/CV-template plan wiring, and live Docker smoke.

## Verification Snapshot

- Backend lint: passed.
- Backend tests: passed, 15 suites / 62 tests.
- Backend build: passed.
- Backend `npm audit --audit-level=high`: passed; moderate Prisma dev-tool advisory remains.
- Frontend lint: passed.
- Frontend tests: passed, 34 suites / 107 tests.
- Frontend build: passed.
- Frontend `npm audit --audit-level=high`: passed; moderate `geist`/`next`/`postcss` advisory remains.
- Docker compose config: valid.
- Docker services: api, worker, frontend, caddy, postgres, redis running.
- Live health: `GET /api/health` returned database and redis ok.
- Live frontend: `GET http://localhost` returned 200.
- Live auth guard smoke: unauthenticated `GET /api/applications` returned 401.
- Live refresh smoke: refresh without cookie returned 401.
- API route map: auth, users, cvs, jobs, applications, payments, gdpr, trial, and health routes are mapped.
- Worker startup: queue worker starts cleanly.
- Local axe smoke: blocked by local Windows Chrome crash, not by app response.

## Open Tasks

- [x] P0 - Fix job posting ownership and cross-user dedupe leakage.
  - Evidence: `JobsService.parse()` uses globally unique `sourceHash` and returns an existing `JobPosting` even if it belongs to another user. `ApplicationsService.create()` validates `masterCvId` ownership but does not validate that `jobPostingId` belongs to the current user.
  - Risk: a user who submits identical job text, or knows a UUID, can create an application linked to another user's `JobPosting` and see parsed job data through application/dashboard responses.
  - DoD:
    - Done: scoped job-posting lookup/dedupe by `userId` and added a composite unique index.
    - Done: validated `jobPostingId` ownership in application creation before creating the application.
    - Done: added backend tests covering same-text cross-user parsing and rejecting foreign `jobPostingId`.
    - Done: backend lint, targeted tests, full tests, build, audit high-severity check, schema validate, Docker health smoke.

- [x] P0 - Enforce TOTP when `twoFactorEnabled` is true.
  - Evidence: `AuthService.login()` still has a TODO for TOTP and issues tokens even when `user.twoFactorEnabled` is true.
  - Risk: accounts marked as 2FA-enabled are not actually protected by the second factor.
  - DoD:
    - Done: added an RFC 6238 TOTP verification path using the stored secret.
    - Done: rejects missing/invalid TOTP for users with 2FA enabled.
    - Done: added login tests for disabled 2FA, missing TOTP, invalid TOTP, and valid TOTP.
    - Done: login form accepts an optional one-time code and still renders API errors through the existing aria-live region.
    - Done: backend lint/tests/build/audit, frontend lint/tests/build/audit, Docker image build, service restart, API health smoke, frontend smoke.

- [x] P1 - Verify and harden Paddle webhook signature handling.
  - Evidence: `PaymentsService.isValidSignature()` expects a simple raw hex HMAC, while Paddle signatures are commonly delivered as structured header values. Current code is likely to reject real Paddle webhook events unless the configured provider sends exactly this custom format.
  - Risk: subscription activation/cancellation may never update user plans in production.
  - DoD:
    - Done: confirmed Paddle's current `Paddle-Signature` format is `ts=...;h1=...`, signed as `timestamp:rawBody` with HMAC-SHA256.
    - Done: parses and verifies the real signature header format with timestamp tolerance and support for multiple `h1` values.
    - Done: added webhook tests for valid activation, valid cancellation, malformed signature, expired timestamp, and wrong secret.
    - Done: backend lint, targeted tests, full tests, build, audit high-severity check, Docker API build/restart, health smoke.

- [x] P1 - Normalize plan enum values between backend and frontend shell.
  - Evidence: backend returns Prisma enum values `FREE`, `PAY_PER_APP`, and `PRO`; `AppShellComponent.planLabel()` only checks lowercase `pro` and `pay`, so a `PRO` user is displayed as `Free` in the shell.
  - Risk: user-facing account state is misleading after payment or admin plan changes.
  - DoD:
    - Done: updated frontend auth/user plan typing to accept backend enum values and legacy lowercase values.
    - Done: normalized display labels and badge classes in the app shell.
    - Done: added shell tests for `FREE`, `PAY_PER_APP`, and `PRO`.
    - Done: frontend targeted tests, lint, full tests, build, audit high-severity check, Docker frontend build/restart, frontend smoke.

- [x] P2 - Decide how to handle remaining moderate dependency advisories.
  - Evidence: backend has moderate Prisma dev-tool advisory via `@hono/node-server`; frontend has moderate advisory through `geist` -> `next` -> `postcss`.
  - Risk: currently not high severity, but audit output stays noisy and may become blocking later.
  - DoD:
    - Done: replaced the frontend `geist` package with font-only `@fontsource/geist` packages, removing the `next` -> `postcss` advisory path.
    - Done: frontend `npm audit --audit-level=moderate` now reports 0 vulnerabilities.
    - Done: backend `npm audit fix --package-lock-only` found no non-breaking fix; `npm audit fix --force` would downgrade Prisma from 7.x to 6.x, so this remains an upstream/tooling hold rather than a safe project change.
    - Done: backend and frontend `npm audit --audit-level=high` remain green.
    - Done: frontend lint, tests, build, Docker frontend build/restart, frontend smoke.

- [ ] P2 - Make local accessibility smoke reproducible on Windows.
  - Evidence: `npx axe http://localhost` fails because local Chrome crashes before the scan starts. CI still installs Chromium on Linux and is wired to run the a11y job.
  - Risk: local visual/a11y verification is harder even though unit/build checks pass.
  - DoD:
    - Add a documented Playwright/Chromium-backed local a11y command or fix the current axe Chrome invocation.
    - Verify at least `/`, `/preise`, `/try`, and one protected-shell route when authenticated test setup exists.

## Completed Plan Checks

- CV-template plan file: no unchecked plan boxes found in the task sections scanned during this audit.
- Post-login UX plan file: completion note present and no unchecked implementation boxes found.
- App-shell plan file: no unchecked implementation boxes found; manual route smoke confirmed `/app/applications/:id` remains outside the shell in route config.
