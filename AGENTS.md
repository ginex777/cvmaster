# Codex Instructions

This repository is the Lebenslauf-Agent skeleton. Treat `CLAUDE.md` as the canonical project policy and use this file as the Codex-oriented quick reference.

## Project Shape

- `frontend/`: Angular 21 standalone SPA with SSR entry points, zoneless/signals style, Tailwind, Jest, and WCAG 2.2 AAA requirements.
- `backend/`: NestJS 10 API on Node/TypeScript with Prisma, Zod, JWT auth, BullMQ-style queue modules, AI provider abstraction, PDF/mail/payments/GDPR modules.
- `infra/`: Docker Compose, Caddy, backup and deploy scripts.
- `docs/`: DSGVO templates plus Superpowers planning/spec notes from previous Claude work.
- Root docs: `README.md`, `spec.md`, and `CLAUDE.md`.

There is no `.git` directory in this workspace at the time this file was created, so do not rely on git status or commits unless git metadata appears later.

## Source Of Truth

Read these before substantial work:

1. `CLAUDE.md` for coding rules, Definition of Done, Angular/Nest conventions, testing, styling, and scope locks.
2. `spec.md` for product architecture and V1 scope.
3. `docs/superpowers/specs/*.md` and `docs/superpowers/plans/*.md` when continuing landing-page or Claude-workflow tasks.

Some imported markdown text currently displays mojibake for German characters. Preserve existing copy carefully when editing affected files; do not "fix" encoding incidentally unless asked.

## Workflow Rules

- Work one feature at a time, backend to frontend to tests to verification.
- Keep changes scoped. Do not refactor unrelated files.
- Preserve user or generated changes you did not make.
- Use existing local patterns before introducing new abstractions.
- For frontend UI work, follow the local frontend-design and frontend-refactor skills when applicable.
- Do not persist uploaded user files. The product policy is RAM-only file processing.
- Do not add dark mode, NgRx, file storage, LinkedIn/Indeed/Xing APIs, browser extensions, or SMTP relay in V1.

## Angular Rules

- New components must be standalone and should have four files: `.ts`, `.html`, `.scss`, `.spec.ts`.
- Prefer Angular CLI generation when creating components.
- Always use `ChangeDetectionStrategy.OnPush`, `templateUrl`, and singular `styleUrl`.
- Use signals (`signal`, `computed`, `effect`) and `inject()`.
- Use Angular block control flow: `@if`, `@for`, `@switch`, `@defer`. Do not use `*ngIf`, `*ngFor`, or `*ngSwitch`.
- Do not import `CommonModule` just for control flow.
- Use Reactive Forms only. No `NgModel`.
- Smart route/page components live in `features/` and own loading/error signals.
- Dumb presentational components live in `shared/components/`, receive data through inputs, and emit actions through outputs.
- Every user-visible error from a smart component must be shown through an `aria-live` region.
- Loading states use skeletons and `aria-busy`, not spinners.
- All UI must meet WCAG 2.2 AAA expectations from `CLAUDE.md`.
- Use tokens from `frontend/src/styles.css`. Avoid hardcoded colors, arbitrary spacing, inline styles, and `!important`.

## NestJS Rules

- Feature modules use controller/service/module separation.
- Validate incoming bodies with Zod, not class-validator.
- Validate every LLM output with Zod schemas before persistence.
- AI calls must go through `AiService`/provider abstractions.
- Use Prisma for database access. No raw SQL.
- Protected routes need `JwtAuthGuard`; plan-gated routes need `PlanGuard` and `@RequirePlan`; resource routes need ownership guards.
- Throw Nest built-in exceptions, not generic `Error`, from controllers/services.
- Wrap user-provided prompt input with delimiters and keep prompt-injection defenses intact.

## Commands

Run from the project root unless noted.

- Backend lint: `cd backend && npm run lint`
- Backend tests: `cd backend && npm test`
- Backend build: `cd backend && npm run build`
- Frontend lint: `cd frontend && npm run lint`
- Frontend tests: `cd frontend && npm test -- --watchAll=false`
- Frontend build: `cd frontend && npm run build`
- Frontend dev server: `cd frontend && npm start`
- Backend dev server: `cd backend && npm run start:dev`
- Infra services: `cd infra && docker compose up -d postgres redis`

Before declaring a feature done, run the Definition of Done verification sequence from `CLAUDE.md` unless the user explicitly asks for a narrower change. If any command cannot be run, state that clearly.

## Current Implementation Notes

- Frontend test runner is Jest (`frontend/jest.config.ts`, `frontend/setup-jest.ts`), not Karma.
- Routes are defined in `frontend/src/app/app.routes.ts`; marketing routes include `/`, `/preise`, `/try`, legal routes, auth routes, and protected `/app` children.
- Global design tokens currently live in `frontend/src/styles.css`; the landing-page Superpowers spec proposes a warmer token set that may not yet be fully applied.
- Backend modules are already wired in `backend/src/app.module.ts`.
- Prisma schema is in `backend/prisma/schema.prisma` and models users, sessions, consents, master CVs, job postings, applications, AI jobs, and audit logs.
- Infra compose includes Caddy, Postgres 16, Redis 7, API, worker, and frontend services.

## Safety And Verification

- Never commit `.env` files.
- Never store original PDFs, generated PDFs, or virus-scan files on disk.
- For DSGVO/Art. 9 related work, favor data minimization and explicit consent flows from `spec.md`.
- For payments, auth, GDPR export/delete, AI outputs, and file upload paths, add or update tests with the implementation.
- For frontend visual work, verify responsive layout and accessibility rather than relying only on unit tests.
