# Product Owner Backlog - Lebenslauf-Agent

Created: 2026-05-13  
Role view: business engineer / product owner  
Scope: current webapp audit, V1 launch readiness, and near-term feature opportunities

## Executive Summary

Lebenslauf-Agent already has a strong V1 foundation: Angular app shell, landing/pricing/try flows, auth, CV upload, job parsing from text, AI pipeline, match scoring, PDF export, GDPR export/delete, Paddle webhook handling, and protected-route a11y smoke coverage.

The remaining product work is not "more screens" first. The next business-critical work is to make the core journey reliable, commercially complete, legally launchable, and easier for a first-time user to finish:

1. Upload or create CV.
2. Add job ad.
3. Generate application.
4. Understand score and gaps.
5. Edit and export/send.
6. Pay or upgrade when limits are reached.

## Current Product Snapshot

### Working Foundations

- Marketing routes exist: `/`, `/preise`, `/try`.
- Auth routes exist: `/login`, `/register`, with email verification and optional TOTP support.
- Protected app routes exist under `/app`: dashboard, CV library, wizard, billing, application editor.
- Backend modules are wired for auth, users, CVs, jobs, applications, AI, queue, PDF, payments, mail, GDPR, health.
- Prisma schema covers users, sessions, consents, master CVs, job postings, applications, AI jobs, and audit logs.
- CV upload supports PDF and DOCX with RAM-only parsing and improved structure checks.
- Job parsing currently supports pasted text and guarded public URL import.
- Application generation queues AI work and persists generation progress/error.
- CV/letter/bundle exports exist and use selected CV templates.
- GDPR export/delete exists, with soft-delete and AI job retention cleanup.
- Paddle webhooks can update user plan status.
- Protected-route Playwright axe smoke tests exist.

### Main Gaps

- The app is close to V1, but still has route/API mismatches and product-scope gaps.
- The new-application wizard is not yet the full 5-field quickstart / all-input-mode experience from the spec.
- Job input is text-only, while V1 spec expects URL, screenshot, and PDF input too.
- Payment checkout is only partially productized; pay-per-app/yearly flows and customer portal are missing.
- Legal/compliance evidence is not launch-complete.
- Some infrastructure configuration is stale or risky for production.
- First-run onboarding, trust-building, follow-up workflows, and LinkedIn text optimization are not yet implemented.

## Prioritization Rules

- P0: launch blocker, data/security/payment/legal risk, or broken core user journey.
- P1: required for credible V1 launch and monetization.
- P2: improves conversion, retention, support load, or user trust.
- P3: post-launch growth/optimization feature.

## Impact-First Execution Order

This is the recommended build order if the goal is maximum business impact first. It cuts across priority labels and balances launch risk, revenue impact, user activation, and implementation dependency.

| Rank | Task | Why It Comes First | Area |
|---:|---|---|---|
| 1 | P0.1 Fix dashboard status update contract | Small fix, directly repairs a broken visible workflow in the authenticated app. | Frontend + Backend |
| 2 | P0.2 Align production environment configuration | Prevents deployment failure from stale env examples and provider mismatch. | Backend + Infra |
| 3 | P0.4 Make payment flows commercially complete | Turns usage limits into revenue instead of dead ends. | Frontend + Backend |
| 4 | P0.3 Complete legal and compliance launch evidence | Required for public launch in Germany with CV/AI/Art. 9-adjacent data. | Legal + Backend + Frontend |
| 5 | P1.1 Complete new application wizard | Biggest activation lever: lets first-time users succeed even without an existing CV. | Frontend + Backend |
| 6 | P1.4 Finish mail-to-self and mailto UX | Completes the user outcome after export: documents can actually be used for applying. | Frontend + Backend |
| 7 | P1.2 Add job input modes beyond text - Done | Increases completion rate for real users who have links or PDFs instead of clean text. | Frontend + Backend |
| 8 | P2.1 Improve first-run onboarding | Reduces drop-off after login and guides users to the first successful application. | Frontend |
| 9 | P2.5 Improve SEO and public trust assets | Supports acquisition and credibility before paid traffic or public launch. | Frontend + Infra |
| 10 | P2.4 Strengthen account and session management | Reduces support risk through password reset, 2FA management, and session visibility. | Frontend + Backend |
| 11 | P1.3 Improve application editor editing model | Improves perceived product quality, but after the core generate/export path is reliable. | Frontend + Backend |
| 12 | P1.5 Add follow-up templates | Adds retention value after the first application is created. | Frontend + Backend |
| 13 | P1.6 Add LinkedIn profile text optimization | Strong differentiator, but should follow the core application workflow. | Frontend + Backend |
| 14 | P2.2 Add product analytics without cookies | Enables funnel learning once the main funnel is usable. | Frontend + Infra |
| 15 | P2.6 Improve support and consent integration | Useful for launch support, but only after consent/legal decisions are settled. | Frontend + Backend |
| 16 | P2.3 Add AI quality and bias monitoring | Important risk control, best after core AI flows and data contracts stabilize. | Backend + Ops |
| 17 | P3.2 Status pipeline and reminders | Good retention feature after users already create multiple applications. | Frontend + Backend |
| 18 | P3.1 Discount and campaign codes | Helpful for marketing campaigns, but not needed before checkout works. | Frontend + Backend |
| 19 | P3.3 Template marketplace / more layouts | Nice expansion after core PDF templates are already trusted. | Frontend + Backend |

## Recommended Next Sprint

If only one sprint is planned, do these in order:

1. P0.1 Fix dashboard status update contract.
2. P0.2 Align production environment configuration.
3. P0.4 Make payment flows commercially complete for Pro monthly at minimum.
4. P1.1 Complete the new-user wizard path for users without an uploaded CV.
5. Add one full happy-path e2e smoke: CV creation/upload -> job parse -> application generation -> editor -> PDF export.

## P0 - Launch Blockers

### P0.1 Fix Dashboard Status Update Contract - Done 2026-05-13

Status: Done.

Completion evidence:

- Frontend dashboard status toggle now calls `PATCH /applications/:id/status`.
- Frontend unit test expects the dedicated status endpoint.
- Existing backend controller test verifies generic updates strip `status` and the dedicated endpoint validates status values.

Problem: `DashboardComponent.toggleStatus()` calls `PATCH /applications/:id` with `{ status }`, but the backend generic PATCH schema no longer accepts status. The dedicated endpoint is `PATCH /applications/:id/status`.

Business impact: users can see a status toggle but the action fails or silently regresses, hurting trust in the core dashboard.

Backend tasks:

- Confirm `PATCH /applications/:id/status` remains the only status mutation endpoint.
- Ensure it validates only allowed status transitions for dashboard values such as `OPEN` and `DONE`.
- Add or update controller/service tests proving generic PATCH rejects status and status endpoint accepts it.

Frontend tasks:

- Change dashboard status toggle to call `/applications/${id}/status`.
- Preserve optimistic UI rollback on failure.
- Add a dashboard unit test for the correct endpoint.
- Show failed status changes in an `aria-live` region.

Acceptance criteria:

- Dashboard status toggle succeeds against the current backend contract.
- Backend tests prove score/report/status cannot be forged through generic PATCH.
- Frontend test verifies the dedicated endpoint is used.

### P0.2 Align Production Environment Configuration - Done 2026-05-13

Status: Done.

Completion evidence:

- `infra/.env.example` now uses `AI_PROVIDER=groq`, `GROQ_API_KEY`, optional Claude fallback keys/models, `MAIL_DOMAIN`, Paddle runtime/server variables, monitoring, support, and backup variables.
- Stale `MISTRAL_API_KEY` and `ALEPH_ALPHA_API_KEY` examples were removed.
- `infra/deploy.sh` now validates required production variables and provider-specific AI keys before restarting containers.
- README documents the current `window.__LBA_CONFIG__` shape used by the frontend pricing checkout.

Problem: `infra/.env.example` still references `AI_PROVIDER=mistral`, `MISTRAL_API_KEY`, and `ALEPH_ALPHA_API_KEY`, while `backend/src/main.ts` only allows `groq` or `claude`.

Business impact: production deployment can fail at startup from copied example config.

Backend/infra tasks:

- Update `infra/.env.example` to use `AI_PROVIDER=groq`, `GROQ_API_KEY`, optional `ANTHROPIC_API_KEY`, `GROQ_MODEL`, and `CLAUDE_MODEL`.
- Add all required payment runtime variables: Paddle client token, pro monthly price, pro yearly price, pay-per-app price, webhook secret.
- Add `MAIL_DOMAIN`, `RESEND_API_KEY`, `APP_URL`, `CRISP_WEBSITE_ID`, Sentry, Plausible, and backup variables consistently.
- Remove stale provider names from docs and examples.
- Add a deploy/readiness checklist that validates environment variables before container restart.

Frontend tasks:

- Decide where runtime Paddle config is injected in production.
- Document expected `window.__LBA_CONFIG__` shape if runtime config remains frontend-driven.
- Fail visibly on pricing page when required checkout config is missing.

Acceptance criteria:

- A developer can copy `.env.example`, fill current variables, and start API/worker without provider mismatch.
- CI or deploy script catches missing required production variables.

### P0.3 Complete Legal And Compliance Launch Evidence - Engineering Done 2026-05-13

Status: Engineering done; external legal sign-off still required before public launch.

Completion evidence:

- GDPR export already excludes raw AI prompts and raw AI responses, exporting AI job metadata only.
- Art. 9 registration consent now stores an immutable evidence-oriented version reference.
- A global support-cookie settings entry point allows users to accept necessary cookies, accept support chat, reopen settings, and revoke consent.
- Crisp loads only after support consent and a configured website ID.
- Register consent copy links to privacy policy and AGB.
- Launch evidence checklist added at `docs/legal-compliance-launch-checklist-2026-05-13.md`.

Problem: DSFA/VVT/TOM working docs exist, but lawyer-reviewed AGB/privacy, signed AVVs, and final evidence links are still open.

Business impact: launch risk for a German product processing CV data, possible Art. 9 data, and AI providers.

Backend tasks:

- Ensure GDPR export excludes raw prompts and includes only legally appropriate AI audit metadata.
- Add immutable consent versioning for Art. 9 processing and support-cookie consent.
- Store consent text/version references so later exports can prove what was accepted.

Frontend tasks:

- Add a visible cookie/settings entry point for support consent revocation.
- Ensure register/upload consent copy is explicit, separate, and not preselected.
- Add final legal links to footer and auth/register flows once lawyer-approved.

Operations/legal tasks:

- Complete lawyer review for AGB and Datenschutzerklaerung.
- Collect AVVs for Groq, Anthropic, Resend, Paddle, IONOS, Crisp or chosen support provider.
- Store evidence under `docs/avv/` or link to the external evidence vault.
- Update README compliance checklist with final document locations.

Acceptance criteria:

- Legal checklist is green for public launch.
- Support/chat scripts load only after valid consent.
- GDPR export/delete behavior matches the published privacy policy.

### P0.4 Make Payment Flows Commercially Complete - Done 2026-05-13

Status: Done.

Completion evidence:

- Pricing page can open Paddle checkout for Pay-per-App, Pro monthly, and Pro yearly price IDs.
- Backend webhook handling maps `transaction.completed` events to `PAY_PER_APP` or `PRO`, handles subscription activation/cancellation, stores Paddle customer IDs, and skips duplicate event IDs.
- Billing page shows the active plan, plan-change CTA, and Paddle customer portal link when configured.
- Unit tests cover checkout options, missing config, portal link rendering, supported Paddle events, invalid signatures, and duplicate webhook events.

Problem: Pricing checkout can open Pro checkout when configured, and webhooks can activate/cancel Pro, but the full commercial model from the spec is not complete.

Business impact: users may hit limits without a reliable purchase path; pay-per-app revenue path is missing.

Backend tasks:

- Add product/price mapping for pay-per-app, Pro monthly, and Pro yearly.
- Extend Paddle webhook handling for `transaction.completed` and subscription lifecycle events.
- Persist Paddle customer ID and transaction IDs where needed.
- Add idempotency handling for duplicate webhooks.
- Add money-back/refund decision logic only after the business rule is finalized.
- Add tests for all supported Paddle events and invalid signatures.

Frontend tasks:

- Add plan selector with Free, Pay-per-App, Pro monthly, Pro yearly.
- Open Paddle checkout with the selected price ID.
- Surface checkout unavailable/configuration errors clearly.
- Add billing state for current plan, limits used, upgrade CTA, and customer portal/cancel link.
- Add tests for each checkout option and missing config.

Acceptance criteria:

- Free limit routes users into a working purchase/upgrade path.
- Payment webhooks update plan reliably and idempotently.
- Billing page makes the current plan and next action obvious.

## P1 - Core V1 Feature Completion

### P1.1 Complete New Application Wizard - Done 2026-05-13

Status: Done.

Completion evidence:

- Added `POST /cvs/quickstart` with Zod validation for name, current role/study, 3-5 skills, language, and target role.
- Quickstart CV generation goes through `AiService` with a schema-validated `ParsedCV` response and prompt-injection delimiters.
- Generated skeletons are persisted as Master CVs with `sourceFilename=quickstart`, stable input hashing, and user ownership.
- Wizard now lets users without a CV create a conservative CV skeleton, review the generated summary/skills, and continue into the normal job/application flow.
- Tests cover backend validation/persistence, controller delegation, frontend quickstart validation, preview rendering, and selected-CV guarding.

Problem: The current wizard mostly requires an existing saved CV plus pasted job text. The V1 spec calls for a more complete quickstart and all-in-one flow.

Backend tasks:

- Add endpoint for 5-field quickstart CV skeleton generation.
- Validate quickstart input with Zod: name, current role/study, 3-5 skills, language, target role.
- Persist generated skeleton as a Master CV with clear source metadata.
- Add tests for validation, AI generation, and RAM-only behavior.

Frontend tasks:

- Add "I do not have a CV yet" quickstart path.
- Add reactive form for the 5 fields.
- Show generated CV skeleton for review before application generation.
- Add skeleton loading state and `aria-live` errors.
- Preserve existing saved-CV selection flow.
- Add tests for quickstart validation, generation success, and error handling.

Acceptance criteria:

- A new user with no CV can create an application without uploading a file.
- Generated CV skeleton is clearly editable and not falsely presented as verified work history.

### P1.2 Add Job Input Modes Beyond Text - Done 2026-05-13

Status: Done.

Completion evidence:

- `POST /jobs/parse` now accepts `text`, `url`, `pdf`, and `screenshot` request shapes.
- Text remains the default path; URL mode fetches public HTTP/HTTPS job pages with DNS-based private-network blocking, timeouts, size limits, content-type checks, and sanitized text extraction before AI parsing.
- PDF and screenshot modes return user-safe disabled-mode errors until RAM-only PDF extraction and approved multimodal processing are compliance-cleared.
- Wizard step 2 now has input-mode tabs for Text, URL, PDF, and Screenshot; PDF/screenshot are clearly unavailable and do not switch the active mode.
- Tests cover URL happy path, SSRF/private target rejection, disabled PDF handling, controller validation, frontend URL submission, and unavailable modes.

Problem: Backend `JobsService` has `url`, `screenshot`, and `pdf` cases marked as not implemented, while the spec lists them as V1 input methods.

Backend tasks:

- Extend `POST /jobs/parse` schema to support `text`, `url`, `pdf`, and `screenshot`.
- Implement URL extraction with allowlisted protocols, timeouts, size limits, and Readability-style cleanup.
- Implement PDF job-ad parsing with RAM-only file handling.
- Implement screenshot/image parsing through approved multimodal provider only if provider/data-transfer compliance is cleared.
- Add rate limits per input type.
- Add tests for URL SSRF protection, large response rejection, invalid PDFs, and provider failures.

Frontend tasks:

- Add input-mode tabs: paste text, URL, PDF, screenshot.
- Add client-side file type and size validation.
- Show extraction preview before generation.
- Make errors specific: unreachable URL, unsupported PDF, screenshot provider unavailable.
- Add tests for each mode and disabled generate state.

Acceptance criteria:

- Text remains the reliable default.
- URL/PDF/screenshot modes either work safely or are hidden behind a clear feature flag until compliant.

### P1.3 Improve Application Editor Editing Model - Done 2026-05-13

Status: Done.

Completion evidence:

- `CvSection` and `CvBullet` interfaces exported from `ApplicationsService`; structured format uses stable IDs for sections and bullets.
- `PATCH /applications/:id/cv` endpoint accepts `{ sections: CvSection[] }` (Zod-validated), ownership-checked via `OwnsApplicationGuard`.
- `ApplicationsService.updateStructuredCv()` persists structured sections as a JSON field.
- 3 new backend service tests: saves sections, ForbiddenException for wrong user, preserves originalText/accepted fields.
- `CvSectionEditorComponent` (dumb, `shared/components/cv-section-editor/`) — 4 files: signal-input `sections` + `saving`, output `sectionsChange`.
- Supports add/remove section, add/remove bullet, inline edit of heading and bullet text with autosave on blur.
- Shows "KI-Original anzeigen" `<details>` toggle when `originalText` differs from current text; Behalten/Zurücksetzen accept-reject controls.
- Shows "✓ Übernommen" accepted badge on confirmed bullets.
- 13 unit tests for CvSectionEditorComponent covering all edit operations.
- `EditorComponent` replaces raw textarea with `<lba-cv-section-editor>`; `normalizeToStructured()` converts all legacy formats (sections with lines, experience bullets, text) to stable format on load.
- 3 new editor tests: normalization on load, `saveStructuredCv()` calls correct endpoint, `onSectionsChange` updates signal and saves.
- All 188 frontend and 129 backend tests pass; lint clean; build green.

Problem: The editor works, but it is currently a text-area centered experience rather than the richer source-aware inline CV editor promised in the spec.

Backend tasks:

- Define stable editable data contracts for optimized CV sections, bullets, source IDs, and letter variants.
- Add endpoints for bullet-level accept/reject/adapt if the product keeps source-aware editing.
- Enforce hallucination guard data in persisted optimized CV.
- Add tests for saving structured edits without losing source metadata.

Frontend tasks:

- Replace raw JSON/text fallback with structured section and bullet editor.
- Show original vs AI suggestion where source data exists.
- Add accept/reject/adapt controls.
- Keep autosave with visible saved/error states.
- Add keyboard-accessible controls and tests for section editing.

Acceptance criteria:

- Users can edit the generated CV without understanding JSON-like data.
- Source attribution and hallucination safeguards survive manual edits where applicable.

### P1.4 Finish Mail-To-Self And Mailto UX - Done 2026-05-13

Status: Done.

Completion evidence:

- Editor exposes "An mich senden" and calls `POST /applications/:id/email-to-self`.
- Backend keeps PDF generation in memory, audits email-to-self success/failure, and returns a user-safe delivery error if mail delivery fails.
- Editor exposes a recipient field and builds a `mailto:` link with subject/body plus a visible attachment limitation reminder.
- Tests cover backend attachments/audit/failure handling and frontend send/mailto success/error states.

Problem: Backend email-to-self exists, but the editor should expose both "send to myself" and "open email program" workflows from the spec.

Backend tasks:

- Keep PDF generation in memory only.
- Add user-safe failure messages for Resend delivery failures.
- Add audit log events for email-to-self attempts.

Frontend tasks:

- Add "An mich senden" action in the editor.
- Add "In E-Mail-Programm oeffnen" action with recipient, subject, and body preview.
- Explain attachment limitation in the UI without implying files are attached by `mailto`.
- Add success/error `aria-live` messages.
- Add tests for both actions.

Acceptance criteria:

- User can get generated documents by email and can prepare an email to an employer.
- No SMTP relay or disk storage is introduced.

### P1.5 Add Follow-Up Templates - Done 2026-05-13

Status: Done.

Completion evidence:

- `GET /applications/:id/follow-up-templates` returns 3 deterministic templates (reminder, status, thanks) with job title and company filled in from the application's job posting; ownership-checked via `OwnsApplicationGuard`.
- 4 backend service tests: returns 3 templates, subject uses job title, fallback for missing parsed title, ForbiddenException for wrong user.
- Application editor gains a "Nachfassen" panel in the Match Report sidebar: lazy-loads templates on button click, displays 3 cards each with a copy-to-clipboard button (with 2s "Kopiert!" feedback) and an "E-Mail öffnen" mailto button.
- 5 frontend tests: initial null state, load success, no-reload guard, error state, copy feedback.
- All 165 frontend tests and 124 backend tests pass; lint clean; build succeeds.

### P1.6 Add LinkedIn Profile Text Optimization - Done 2026-05-13

Status: Done.

Completion evidence:

- `POST /linkedin/optimize` (PRO plan required via `@RequirePlan('PRO')` + `PlanGuard`, throttled 5/min) accepts `profileText` (50–20,000 chars) + `targetRole` (2–200 chars), validated with Zod.
- AI call uses `prompts/linkedin-optimizer.txt` system prompt with `LinkedInOptimizationSchema` (Zod): `{ headline, about, experience[{role, company, improvedBullets}] }`.
- Input wrapped with `wrapUntrustedContent('LINKEDIN_PROFILE_INPUT_JSON', ...)` for prompt-injection defence; 3-retry logic on schema failure.
- 2 backend service tests: correct args forwarded to AiService, errors propagated.
- `LinkedInComponent` at `/app/linkedin`: form with profile textarea + target role input, lazy result section with Headline/About/Experience cards, copy-to-clipboard with 2s feedback, 403 → PRO-upgrade message.
- "LinkedIn" nav link added to app-shell.
- 7 frontend tests: initial null state, loading signal, success, 403 error, API error, correct POST args, copy feedback.
- All 172 frontend tests and 126 backend tests pass; lint clean; build succeeds.

## P2 - Conversion, Trust, And Retention

### P2.1 Improve First-Run Onboarding - Done 2026-05-13

Status: Done.

Completion evidence:

- Added `onboardingDismissedAt` to the User model with migration.
- Dashboard API now returns `onboardingDismissed` flag alongside existing stats.
- Added `POST /users/me/dismiss-onboarding` endpoint (204 No Content).
- Dashboard shows a 3-step checklist (upload CV, create application, export) with per-step completion derived from live cvCount/applicationCount/status data.
- Steps marked done visually; CTAs hidden once step is complete.
- Dismiss button calls the endpoint and hides the panel optimistically.
- 5 new backend tests; 5 new frontend onboarding tests (show/hide, step states, dismiss call).

Backend tasks:

- Add `onboardingCompletedAt` or lightweight user preference storage if needed.
- Optionally track first CV upload and first export as product events in audit log.

Frontend tasks:

- Add first-login checklist: upload CV, create first application, export PDFs.
- Add empty states with direct CTAs and no marketing filler inside the app.
- Add dismissible onboarding state.
- Add tests for first-run and returning-user states.

Acceptance criteria:

- A first-time user always knows the next useful action.

### P2.2 Add Product Analytics Without Cookies

Backend/infra tasks:

- Configure Plausible self-hosted or document external Plausible deployment.
- Add event taxonomy: trial started, trial completed, register started, CV uploaded, app generated, export clicked, checkout opened, checkout completed.
- Ensure analytics contains no CV/job text or personal data.

Frontend tasks:

- Add small analytics service gated to cookieless Plausible only.
- Track product funnel events.
- Add tests that event payloads do not include user content.

Acceptance criteria:

- Funnel conversion can be measured without cookie banner expansion or personal data leakage.

### P2.3 Add AI Quality And Bias Monitoring

Backend tasks:

- Build fixture-based AI eval job for CV/job pairs.
- Track schema failures, hallucination flags, score drift, and provider cost.
- Add bias test set based on equivalent CVs with varied names/photos/locations.
- Add nightly or manual command for eval runs.

Frontend tasks:

- Add internal/admin-only quality dashboard only if admin tooling exists.
- Otherwise document report output in ops docs.

Acceptance criteria:

- Team can detect provider regressions before users do.

### P2.4 Strengthen Account And Session Management - Done 2026-05-13

Status: Done.

Completion evidence:

- `POST /auth/forgot-password` (throttled 3/15min) creates a `PasswordReset` token and sends recovery email; no user enumeration.
- `POST /auth/reset-password` (throttled 5/15min) validates token, updates Argon2 hash, revokes all existing sessions, logs audit event.
- `GET /users/me/sessions` returns all non-revoked, non-expired sessions.
- `DELETE /users/me/sessions/:id` revokes a specific session with ownership check.
- `POST /users/me/change-password` verifies current password with Argon2, updates hash.
- `POST /users/me/totp/setup` generates a random 20-byte TOTP secret (base32-encoded), stores pending in `twoFactorSecret`, returns secret + `otpauth://` URI.
- `POST /users/me/totp/enable` verifies a 6-digit TOTP code and sets `twoFactorEnabled: true`.
- `POST /users/me/totp/disable` verifies current password and clears TOTP secret/enabled flag.
- Audit log entries written for all sensitive auth events.
- `ForgotPasswordComponent` at `/forgot-password`: email form, success state, error handling, 4 tests.
- `ResetPasswordComponent` at `/reset-password`: reads token from query params, password + confirm fields, redirects to `/login?reset=1` on success, 6 tests.
- `SecurityComponent` at `/app/security`: change password form, 2FA setup/enable/disable flow with QR code, active sessions list with per-session revoke, 9 tests.
- "Sicherheit" nav link added to app-shell.
- All 160 frontend tests pass; lint clean; build succeeds.

### P2.5 Improve SEO And Public Trust Assets - Done 2026-05-13

Status: Done.

Completion evidence:

- `frontend/public/robots.txt` allows all crawlers and links to sitemap.
- `frontend/public/sitemap.xml` lists all 6 public routes with changefreq and priority.
- `SeoService` injects Angular `Meta` and `Title` services; every public route component calls `setPage(title, description, path)`.
- `index.html` includes base OG and Twitter meta tags as server-side fallback.
- FAQ page at `/faq` with 8 questions across 3 sections, accessible accordion (aria-expanded), JSON-LD FAQPage structured data injected programmatically into `document.head`, 5 unit tests.
- Footer updated with FAQ link and `/.well-known/security.txt` link.
- Caddy `security.txt` updated from `security@example.de` to `security@lebenslauf-agent.de`.

Frontend/infra tasks:

- Add `robots.txt`, `sitemap.xml`, and structured data for marketing pages.
- Add OG/Twitter metadata per public route.
- Add security page linking to `/.well-known/security.txt`.
- Replace placeholder `security@example.de` with the real security contact.
- Add FAQ page with structured `<details>` content.

Backend tasks:

- Ensure Caddy and backend headers agree on CSP and security policy.

Acceptance criteria:

- Public pages are indexable, shareable, and credible for German users.

### P2.6 Improve Support And Consent Integration

Backend tasks:

- Decide if support consent is local-only or persisted as a `Consent` row.
- If persisted, add endpoint to save/revoke support consent.

Frontend tasks:

- Render cookie/support consent banner or settings modal in app root.
- Load Crisp only if `CRISP_WEBSITE_ID` exists and support consent is true.
- Add footer link "Cookie-Einstellungen".
- Add tests for accept necessary, accept all, revoke, and no-script-load before consent.

Acceptance criteria:

- Support chat cannot load before consent.
- User can revoke consent at any time.

## P3 - Post-Launch Growth Features

### P3.1 Discount And Campaign Codes

Backend tasks:

- Model campaign codes or map Paddle discount IDs.
- Add server-side validation for launch/student offers.

Frontend tasks:

- Add campaign code entry on pricing/billing.
- Add landing-page campaign variants for student and launch campaigns.

Acceptance criteria:

- Codes like `STUDENT20` and `LAUNCH10` can be run without manual payment changes.

### P3.2 Status Pipeline And Reminders

Backend tasks:

- Add reminder dates and status history for applications.
- Add scheduled email reminders for follow-up.

Frontend tasks:

- Add kanban or pipeline view: Offen, Gesendet, Antwort, Interview, Angebot, Absage.
- Add reminder picker and next-action labels.

Acceptance criteria:

- Users return to the app after exporting instead of treating it as a one-time generator.

### P3.3 Template Marketplace / More Layouts

Backend tasks:

- Add template metadata and preview thumbnails if layouts expand.
- Keep ATS-safe fallback generation.

Frontend tasks:

- Add richer template preview and comparison.
- Allow per-application layout override while preserving Master CV default.

Acceptance criteria:

- Users can choose a visual style confidently without hurting ATS compatibility.

## Cross-Cutting Technical Tasks

### Testing And Quality

- Keep the Definition of Done sequence from `CLAUDE.md` for every implemented feature.
- Add e2e smoke for the full happy path: register, verify bypass or seeded login, upload CV, parse job, generate application, editor, export.
- Add payment sandbox e2e once Paddle sandbox credentials are available.
- Add visual regression screenshots for landing, dashboard, wizard, editor, CV library, billing.
- Add axe checks for any new authenticated route.

### Security And Privacy

- Keep file processing RAM-only; never persist uploaded or generated PDFs.
- Add SSRF protections before URL job parsing.
- Keep all AI user content wrapped in untrusted-content delimiters.
- Do not store raw prompts unless legal policy changes.
- Review CSP every time a third-party script is added.
- Add dependency scanning cadence and document handling of moderate Prisma tooling advisories.

### Operations

- Add production deploy checklist: env validation, migrations, health check, worker health, Caddy reload, backup test.
- Add monthly restore-test procedure for encrypted DB backups.
- Add `/api/health` dependency checks to uptime monitor.
- Add Sentry self-hosted or configure DSN injection and scrub PII.
- Document how to rotate JWT, Paddle, Resend, Groq, Anthropic, and backup credentials.

## Suggested Release Plan

### Release 0.9 - Fix The Core Journey

- P0.1 Dashboard status endpoint fix.
- P0.2 Environment configuration alignment.
- P0.4 Payment flow completion for at least Pro monthly.
- E2E happy path smoke from CV upload to PDF export.

### Release 1.0 - Public Launch Candidate

- P0.3 Legal/compliance launch evidence.
- P1.1 New user quickstart.
- P1.2 Job URL/PDF mode or feature-flag unavailable modes.
- P1.4 Send/email workflows.
- P2.5 SEO/trust assets.

### Release 1.1 - Retention And Differentiation

- P1.5 Follow-up templates.
- P1.6 LinkedIn pasted-text optimization.
- P2.1 First-run onboarding.
- P2.2 Product analytics.
- P2.4 Account recovery and security page.

### Release 1.2 - Quality And Growth

- P2.3 AI quality/bias monitoring.
- P2.6 Support consent and Crisp.
- P3.1 Campaign codes.
- P3.2 Pipeline reminders.

## Immediate Next Actions

1. Done - Fix the dashboard status API mismatch.
2. Done - Update `infra/.env.example` so local and production configuration matches the current code.
3. Done - Complete Pro monthly checkout and webhook handling as the minimum paid launch path.
4. Done - Start the no-CV quickstart wizard, because it has the highest activation impact after blockers.
5. Move legal/compliance evidence from working docs to final launch checklist once external review is complete.
