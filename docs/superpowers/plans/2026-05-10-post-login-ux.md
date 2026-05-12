# Post-Login App Shell — Implementation Plan

> Codex completion note: completed ranges are checked only after their relevant DoD commands passed. Task 9 Dashboard and Task 13 final verification remain open until dashboard gaps are closed and the final full verification/smoke pass is rerun.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring the post-login app into spec by closing all gaps between the existing implementation and the approved UX design (docs/superpowers/specs/2026-05-10-post-login-ux-design.md).

**Architecture:** Backend-first (DB schema → service → controller → tests), then frontend feature by feature. Each task is independently deployable.

**Tech Stack:** NestJS (backend), Angular 21 standalone signals (frontend), Prisma + PostgreSQL, BullMQ, pdf-lib, archiver (new dep for ZIP)

---

## What Already Exists (do NOT re-implement)

- Auth: JWT, refresh, guards (`JwtAuthGuard`, `OwnsApplicationGuard`, `PlanGuard`)
- Dashboard: stat cards (cvCount, applicationCount), last-5 table, empty state, skeleton loaders
- Editor: full 3-panel layout (match report + CV textarea + letter tabs), autosave, CV PDF download, polling while generating
- Wizard: 3-step flow (CV select → job text → confirm), CV upload, API calls, navigation
- CV Library: list, PDF/DOCX upload, delete
- Billing: plan display, GDPR export/delete
- BullMQ worker: full AI pipeline (optimize + letters + score), hallucination filter, sanitizer
- PdfService: `generateCvPdf(data: CvPdfData): Promise<Buffer>`
- Shared: `AppShellComponent` (navbar), `ScoreRingComponent`, `KeywordBarComponent`

---

## File Map

**Backend — create:**
- `backend/prisma/migrations/YYYYMMDD_add_open_done_status/migration.sql`
- `backend/src/applications/applications-list.dto.ts`

**Backend — modify:**
- `backend/prisma/schema.prisma` — add `OPEN`, `DONE` to `AppStatus` enum
- `backend/src/users/users.service.ts` — add `avgMatchScore` to `getDashboard()`
- `backend/src/applications/applications.service.ts` — add `findAll()`, `create()` plan check
- `backend/src/applications/applications.controller.ts` — add `GET /applications`
- `backend/src/queue/ai-pipeline.processor.ts` — add `regenerate-letter` job handler
- `backend/src/pdf/pdf.service.ts` — add `generateLetterPdf()`
- `backend/src/cvs/cvs.service.ts` — add ownership check to `update()`

**Backend — test:**
- `backend/src/applications/applications.service.spec.ts`
- `backend/src/users/users.service.spec.ts`
- `backend/src/cvs/cvs.service.spec.ts`

**Frontend — generate via CLI then modify:**
- `frontend/src/app/shared/components/confirm-delete-modal/confirm-delete-modal.component.{ts,html,scss,spec.ts}`
- `frontend/src/app/shared/components/upgrade-modal/upgrade-modal.component.{ts,html,scss,spec.ts}`

**Frontend — modify:**
- `frontend/src/app/features/dashboard/dashboard.component.{ts,html,scss,spec.ts}`
- `frontend/src/app/features/application-editor/editor.component.{ts,html,scss,spec.ts}`
- `frontend/src/app/features/wizard/wizard.component.{ts,html,scss,spec.ts}`
- `frontend/src/app/features/master-cvs/master-cvs.component.{ts,html,spec.ts}`

---

## Task 1: Backend — Add OPEN and DONE to AppStatus enum

**Files:**
- Modify: `backend/prisma/schema.prisma`
- Modify: `backend/src/queue/ai-pipeline.processor.ts`
- Test: run `nest build` to verify no type errors after migration

- [x] **Step 1: Add enum values to schema**

In `backend/prisma/schema.prisma`, update the `AppStatus` enum:

```prisma
enum AppStatus {
  DRAFT
  OPEN
  DONE
  EXPORTED
  SENT
  REPLIED
  INTERVIEW
  REJECTED
  OFFER
}
```

- [x] **Step 2: Create and run migration**

```bash
cd backend && npx prisma migrate dev --name add_open_done_status
```

Expected: migration file created, `npx prisma generate` runs automatically.

- [x] **Step 3: Update worker to set OPEN after pipeline completes**

In `backend/src/queue/ai-pipeline.processor.ts`, change line that sets status after completion:

```typescript
// Line currently sets status: 'DRAFT' — change to OPEN:
await this.prisma.application.update({
  where: { id: applicationId },
  data: { optimizedCv, coverLetter, matchScore: result.score, matchReport, status: 'OPEN' },
});
```

- [x] **Step 4: Update controller's statusSchema to accept OPEN and DONE**

In `backend/src/applications/applications.controller.ts`, the `statusSchema` already uses `z.nativeEnum(AppStatus)` — no change needed since AppStatus now includes OPEN and DONE. Verify:

```bash
cd backend && npm run build
```

Expected: exit 0, no type errors.

- [x] **Step 5: Update dashboard statusLabel mapping in frontend**

In `frontend/src/app/features/dashboard/dashboard.component.ts`, add OPEN and DONE to the labels map:

```typescript
statusLabel(status: string): string {
  const labels: Record<string, string> = {
    DRAFT: 'Wird optimiert…',
    OPEN: 'Offen',
    DONE: 'Erledigt',
    EXPORTED: 'Exportiert',
    SENT: 'Gesendet',
    REPLIED: 'Antwort erhalten',
    INTERVIEW: 'Interview',
    REJECTED: 'Abgelehnt',
    OFFER: 'Angebot',
  };
  return labels[status] ?? status;
}
```

- [x] **Step 6: Commit**

```bash
git add backend/prisma backend/src/queue/ai-pipeline.processor.ts frontend/src/app/features/dashboard/dashboard.component.ts
git commit -m "Add OPEN/DONE status to AppStatus enum and update worker"
```

---

## Task 2: Backend — Add avgMatchScore to dashboard + GET /applications list

**Files:**
- Modify: `backend/src/users/users.service.ts`
- Modify: `backend/src/applications/applications.service.ts`
- Modify: `backend/src/applications/applications.controller.ts`
- Test: `backend/src/users/users.service.spec.ts`

- [x] **Step 1: Write failing test for getDashboard with avgMatchScore**

In `backend/src/users/users.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../common/prisma.service';

describe('UsersService', () => {
  describe('getDashboard', () => {
    it('returns avgMatchScore as average of non-null matchScores', async () => {
      const mockPrisma = {
        masterCv: { count: jest.fn().mockResolvedValue(2) },
        application: {
          count: jest.fn().mockResolvedValue(3),
          findMany: jest.fn().mockResolvedValue([
            { id: '1', status: 'OPEN', matchScore: 80, createdAt: new Date(), jobPosting: { parsedJson: {} } },
            { id: '2', status: 'DONE', matchScore: 60, createdAt: new Date(), jobPosting: { parsedJson: {} } },
          ]),
          aggregate: jest.fn().mockResolvedValue({ _avg: { matchScore: 70 } }),
        },
      };
      const module = await Test.createTestingModule({
        providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();
      const service = module.get(UsersService);
      const result = await service.getDashboard('user-1');
      expect(result.avgMatchScore).toBe(70);
    });

    it('returns null avgMatchScore when no applications have a score', async () => {
      const mockPrisma = {
        masterCv: { count: jest.fn().mockResolvedValue(0) },
        application: {
          count: jest.fn().mockResolvedValue(0),
          findMany: jest.fn().mockResolvedValue([]),
          aggregate: jest.fn().mockResolvedValue({ _avg: { matchScore: null } }),
        },
      };
      const module = await Test.createTestingModule({
        providers: [UsersService, { provide: PrismaService, useValue: mockPrisma }],
      }).compile();
      const service = module.get(UsersService);
      const result = await service.getDashboard('user-1');
      expect(result.avgMatchScore).toBeNull();
    });
  });
});
```

- [x] **Step 2: Run test — verify it fails**

```bash
cd backend && npx jest users.service.spec.ts --no-coverage
```

Expected: FAIL — `result.avgMatchScore` is undefined.

- [x] **Step 3: Update getDashboard to include avgMatchScore**

In `backend/src/users/users.service.ts`:

```typescript
async getDashboard(userId: string) {
  const [cvCount, applicationCount, recentApplications, agg] = await Promise.all([
    this.prisma.masterCv.count({ where: { userId } }),
    this.prisma.application.count({ where: { userId } }),
    this.prisma.application.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        status: true,
        matchScore: true,
        createdAt: true,
        jobPosting: { select: { parsedJson: true } },
      },
    }),
    this.prisma.application.aggregate({
      where: { userId, matchScore: { not: null } },
      _avg: { matchScore: true },
    }),
  ]);
  return {
    cvCount,
    applicationCount,
    avgMatchScore: agg._avg.matchScore !== null ? Math.round(agg._avg.matchScore) : null,
    recentApplications,
  };
}
```

- [x] **Step 4: Run test — verify it passes**

```bash
cd backend && npx jest users.service.spec.ts --no-coverage
```

Expected: PASS.

- [x] **Step 5: Add GET /applications list endpoint**

In `backend/src/applications/applications.service.ts`, add `findAll()` after the existing methods:

```typescript
async findAll(userId: string) {
  return this.prisma.application.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      matchScore: true,
      createdAt: true,
      jobPosting: { select: { parsedJson: true } },
    },
  });
}
```

In `backend/src/applications/applications.controller.ts`, add before the `@Get(':id')` route:

```typescript
@Get()
findAll(@Req() req: AuthenticatedRequest) {
  return this.apps.findAll(req.user.sub);
}
```

- [x] **Step 6: Build backend**

```bash
cd backend && npm run build
```

Expected: exit 0.

- [x] **Step 7: Commit**

```bash
git add backend/src/users backend/src/applications
git commit -m "Add avgMatchScore to dashboard, add GET /applications list"
```

---

## Task 3: Backend — Plan enforcement on POST /applications

**Files:**
- Modify: `backend/src/applications/applications.service.ts`
- Test: `backend/src/applications/applications.service.spec.ts`

- [x] **Step 1: Write failing test**

In `backend/src/applications/applications.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ApplicationsService } from './applications.service';
import { PrismaService } from '../common/prisma.service';
import { QueueService } from '../queue/queue.service';
import { MailService } from '../mail/mail.service';
import { HttpException } from '@nestjs/common';

describe('ApplicationsService', () => {
  describe('create', () => {
    it('throws 402 when FREE user already has 1 application', async () => {
      const mockPrisma = {
        masterCv: { findFirst: jest.fn().mockResolvedValue({ id: 'cv-1', userId: 'user-1' }) },
        application: {
          count: jest.fn().mockResolvedValue(1),
          create: jest.fn(),
        },
        user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ plan: 'FREE' }) },
      };
      const module = await Test.createTestingModule({
        providers: [
          ApplicationsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: QueueService, useValue: { enqueueAiPipeline: jest.fn() } },
          { provide: MailService, useValue: {} },
        ],
      }).compile();
      const service = module.get(ApplicationsService);

      await expect(
        service.create({ masterCvId: 'cv-1', jobPostingId: 'job-1' }, 'user-1'),
      ).rejects.toThrow(HttpException);

      expect(mockPrisma.application.create).not.toHaveBeenCalled();
    });

    it('creates application when FREE user has 0 applications', async () => {
      const createdApp = { id: 'app-1', userId: 'user-1' };
      const mockPrisma = {
        masterCv: { findFirst: jest.fn().mockResolvedValue({ id: 'cv-1', userId: 'user-1' }) },
        application: {
          count: jest.fn().mockResolvedValue(0),
          create: jest.fn().mockResolvedValue(createdApp),
        },
        user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ plan: 'FREE' }) },
      };
      const mockQueue = { enqueueAiPipeline: jest.fn() };
      const module = await Test.createTestingModule({
        providers: [
          ApplicationsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: QueueService, useValue: mockQueue },
          { provide: MailService, useValue: {} },
        ],
      }).compile();
      const service = module.get(ApplicationsService);

      const result = await service.create({ masterCvId: 'cv-1', jobPostingId: 'job-1' }, 'user-1');
      expect(result).toEqual(createdApp);
      expect(mockQueue.enqueueAiPipeline).toHaveBeenCalledWith('app-1');
    });

    it('allows PRO user to create without limit', async () => {
      const createdApp = { id: 'app-2', userId: 'user-2' };
      const mockPrisma = {
        masterCv: { findFirst: jest.fn().mockResolvedValue({ id: 'cv-1', userId: 'user-2' }) },
        application: {
          count: jest.fn().mockResolvedValue(50),
          create: jest.fn().mockResolvedValue(createdApp),
        },
        user: { findUniqueOrThrow: jest.fn().mockResolvedValue({ plan: 'PRO' }) },
      };
      const module = await Test.createTestingModule({
        providers: [
          ApplicationsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: QueueService, useValue: { enqueueAiPipeline: jest.fn() } },
          { provide: MailService, useValue: {} },
        ],
      }).compile();
      const service = module.get(ApplicationsService);
      const result = await service.create({ masterCvId: 'cv-1', jobPostingId: 'job-1' }, 'user-2');
      expect(result).toEqual(createdApp);
    });
  });
});
```

- [x] **Step 2: Run test — verify it fails**

```bash
cd backend && npx jest applications.service.spec.ts --no-coverage
```

Expected: FAIL.

- [x] **Step 3: Implement plan check in create()**

In `backend/src/applications/applications.service.ts`:

```typescript
import { ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
// ... existing imports

async create(data: { masterCvId: string; jobPostingId: string }, userId: string) {
  const [cv, user] = await Promise.all([
    this.prisma.masterCv.findFirst({ where: { id: data.masterCvId, userId } }),
    this.prisma.user.findUniqueOrThrow({ where: { id: userId } }),
  ]);

  if (!cv) throw new NotFoundException('Master-CV nicht gefunden');

  if (user.plan === 'FREE') {
    const count = await this.prisma.application.count({ where: { userId } });
    if (count >= 1) {
      throw new HttpException(
        { message: 'Kostenlose Bewerbung bereits genutzt. Bitte upgraden.', code: 'PLAN_LIMIT' },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
  }

  const app = await this.prisma.application.create({
    data: { userId, masterCvId: data.masterCvId, jobPostingId: data.jobPostingId, status: 'DRAFT' },
  });
  await this.queue.enqueueAiPipeline(app.id);
  return app;
}
```

- [x] **Step 4: Run tests — verify they pass**

```bash
cd backend && npx jest applications.service.spec.ts --no-coverage
```

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add backend/src/applications
git commit -m "Enforce free plan limit (1 application) on POST /applications"
```

---

## Task 4: Backend — Fix regenerate-letter worker handler

**Files:**
- Modify: `backend/src/queue/ai-pipeline.processor.ts`

- [x] **Step 1: Add job name check to the processor**

In `backend/src/queue/ai-pipeline.processor.ts`, update `onModuleInit()` and `process()`:

```typescript
onModuleInit() {
  this.redis = new IORedis(redisUrl(), { maxRetriesPerRequest: null });
  new Worker('ai-pipeline', (job) => this.process(job), { connection: this.redis });
}

private async process(job: Job) {
  if (job.name === 'regenerate-letter') {
    return this.processRegenerateLetter(job);
  }
  return this.processFullPipeline(job);
}
```

- [x] **Step 2: Extract existing pipeline logic to processFullPipeline()**

In the same file, rename the existing `process()` body to `processFullPipeline()`:

```typescript
private async processFullPipeline(job: Job) {
  const { applicationId } = job.data;

  const app = await this.prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { masterCv: true, jobPosting: true },
  });

  const originalCv = app.masterCv.parsedJson as unknown as ParsedCV;
  const parsedJob = app.jobPosting.parsedJson as unknown as ParsedJob;

  await job.updateProgress(10);

  const rawOptimizedCv = await this.ai.optimizeCv(originalCv, parsedJob);
  const guardedCv = filterHallucinatedSkills(rawOptimizedCv, originalCv);
  const optimizedCv = sanitizeCv(guardedCv);
  await job.updateProgress(50);

  const rawLetter = await this.ai.generateCoverLetter(optimizedCv, parsedJob);
  const coverLetter = sanitizeLetter(rawLetter);
  await job.updateProgress(85);

  const result = this.scoring.score(optimizedCv, parsedJob);
  const matchReport = {
    summary: result.summary,
    matchedKeywords: result.matchedKeywords,
    missingKeywords: result.missingKeywords,
    strengths: result.strengths,
    risks: result.risks,
  };

  await this.prisma.application.update({
    where: { id: applicationId },
    data: { optimizedCv, coverLetter, matchScore: result.score, matchReport, status: 'OPEN' },
  });

  await job.updateProgress(100);
}
```

- [x] **Step 3: Add processRegenerateLetter() — letters only, no CV re-optimize**

```typescript
private async processRegenerateLetter(job: Job) {
  const { applicationId } = job.data;

  const app = await this.prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { jobPosting: true },
  });

  // Use the already-optimized CV, not the original
  const optimizedCv = app.optimizedCv as unknown as ParsedCV;
  const parsedJob = app.jobPosting.parsedJson as unknown as ParsedJob;

  await job.updateProgress(20);

  const rawLetter = await this.ai.generateCoverLetter(optimizedCv, parsedJob);
  const coverLetter = sanitizeLetter(rawLetter);

  await this.prisma.application.update({
    where: { id: applicationId },
    data: { coverLetter },
  });

  await job.updateProgress(100);
}
```

- [x] **Step 4: Build backend**

```bash
cd backend && npm run build
```

Expected: exit 0.

- [x] **Step 5: Commit**

```bash
git add backend/src/queue
git commit -m "Fix regenerate-letter worker: letters-only, no CV re-optimization"
```

---

## Task 5: Backend — Letter PDF + Bundle ZIP endpoints

**Files:**
- Modify: `backend/src/pdf/pdf.service.ts`
- Modify: `backend/src/applications/applications.controller.ts`
- Install: `archiver` + types

- [x] **Step 1: Install archiver**

```bash
cd backend && npm install archiver && npm install --save-dev @types/archiver
```

- [x] **Step 2: Add generateLetterPdf() to PdfService**

In `backend/src/pdf/pdf.service.ts`, add this method after `generateCvPdf()`:

```typescript
async generateLetterPdf(text: string, recipientName: string): Promise<Buffer> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const margin = 60;
  const lineHeight = 16;
  let y = 780;

  page.drawText(this.cleanText(recipientName), {
    x: margin, y, font: boldFont, size: 14, color: rgb(0.08, 0.07, 0.16),
  });
  y -= 32;

  for (const line of this.wrapText(text, 85).flatMap(l => l.split('\n'))) {
    if (y < 60) { page = pdfDoc.addPage([595, 842]); y = 780; }
    page.drawText(this.cleanText(line), { x: margin, y, font, size: 11, color: rgb(0.22, 0.2, 0.32) });
    y -= lineHeight;
  }

  return Buffer.from(await pdfDoc.save());
}
```

- [x] **Step 3: Add letter PDF and bundle endpoints to controller**

In `backend/src/applications/applications.controller.ts`, add these two routes after `@Get(':id/pdf')`:

```typescript
@Get(':id/pdf/letter')
async downloadLetterPdf(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
  const app = await this.apps.findOne(id, req.user.sub);
  if (!app.coverLetter) {
    res.status(404).json({ message: 'Anschreiben noch nicht generiert' });
    return;
  }
  const letters = app.coverLetter as Record<string, string>;
  const variant = (app.chosenVariant as string | null) ?? 'formal';
  const text = letters[variant] ?? letters['formal'] ?? '';
  const title = this.fileTitle(app);
  const buffer = await this.pdf.generateLetterPdf(text, title);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${this.safeFilename('Anschreiben_' + title)}.pdf"`,
    'Content-Length': buffer.length.toString(),
  });
  res.send(buffer);
}

@Get(':id/pdf/bundle')
async downloadBundle(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
  const app = await this.apps.findOne(id, req.user.sub);
  if (!app.optimizedCv || !app.coverLetter) {
    res.status(404).json({ message: 'Dokumente noch nicht generiert' });
    return;
  }

  const title = this.fileTitle(app);
  const letters = app.coverLetter as Record<string, string>;
  const variant = (app.chosenVariant as string | null) ?? 'formal';
  const letterText = letters[variant] ?? letters['formal'] ?? '';

  const [cvBuffer, letterBuffer] = await Promise.all([
    this.pdf.generateCvPdf(this.toPdfData(app.optimizedCv, title)),
    this.pdf.generateLetterPdf(letterText, title),
  ]);

  const archiver = await import('archiver');
  const archive = archiver.default('zip', { zlib: { level: 6 } });
  const chunks: Buffer[] = [];
  archive.on('data', (chunk: Buffer) => chunks.push(chunk));

  await new Promise<void>((resolve, reject) => {
    archive.on('end', resolve);
    archive.on('error', reject);
    archive.append(cvBuffer, { name: `${this.safeFilename('Lebenslauf_' + title)}.pdf` });
    archive.append(letterBuffer, { name: `${this.safeFilename('Anschreiben_' + title)}.pdf` });
    archive.finalize();
  });

  const zipBuffer = Buffer.concat(chunks);
  res.set({
    'Content-Type': 'application/zip',
    'Content-Disposition': `attachment; filename="${this.safeFilename('Bewerbung_' + title)}.zip"`,
    'Content-Length': zipBuffer.length.toString(),
  });
  res.send(zipBuffer);
}
```

- [x] **Step 4: Build backend**

```bash
cd backend && npm run build
```

Expected: exit 0.

- [x] **Step 5: Commit**

```bash
git add backend/src/pdf backend/src/applications backend/package.json backend/package-lock.json
git commit -m "Add letter PDF and bundle ZIP download endpoints"
```

---

## Task 6: Backend — Fix PATCH /cvs/:id missing ownership check

**Files:**
- Modify: `backend/src/cvs/cvs.service.ts`
- Test: `backend/src/cvs/cvs.service.spec.ts`

- [x] **Step 1: Write failing test**

In `backend/src/cvs/cvs.service.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { CvsService } from './cvs.service';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { ForbiddenException } from '@nestjs/common';

describe('CvsService', () => {
  describe('update', () => {
    it('throws ForbiddenException when CV does not belong to user', async () => {
      const mockPrisma = {
        masterCv: {
          findFirst: jest.fn().mockResolvedValue(null),
          update: jest.fn(),
        },
      };
      const module = await Test.createTestingModule({
        providers: [
          CvsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: AiService, useValue: {} },
        ],
      }).compile();
      const service = module.get(CvsService);

      await expect(service.update('cv-1', 'user-1', { name: 'New Name' })).rejects.toThrow(ForbiddenException);
      expect(mockPrisma.masterCv.update).not.toHaveBeenCalled();
    });

    it('updates when CV belongs to user', async () => {
      const cv = { id: 'cv-1', userId: 'user-1', name: 'Old' };
      const mockPrisma = {
        masterCv: {
          findFirst: jest.fn().mockResolvedValue(cv),
          update: jest.fn().mockResolvedValue({ ...cv, name: 'New Name' }),
        },
      };
      const module = await Test.createTestingModule({
        providers: [
          CvsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: AiService, useValue: {} },
        ],
      }).compile();
      const service = module.get(CvsService);

      const result = await service.update('cv-1', 'user-1', { name: 'New Name' });
      expect(result.name).toBe('New Name');
    });
  });
});
```

- [x] **Step 2: Run test — verify it fails**

```bash
cd backend && npx jest cvs.service.spec.ts --no-coverage
```

Expected: FAIL — no ownership check exists.

- [x] **Step 3: Find the update method in cvs.service.ts and add ownership check**

Read the current `update()` method in `backend/src/cvs/cvs.service.ts`. It likely calls `prisma.masterCv.update({ where: { id } })` without checking `userId`. Update it:

```typescript
async update(id: string, userId: string, data: { name?: string; language?: string }) {
  const cv = await this.prisma.masterCv.findFirst({ where: { id, userId } });
  if (!cv) throw new ForbiddenException('Kein Zugriff auf diesen Lebenslauf');
  return this.prisma.masterCv.update({ where: { id }, data });
}
```

Also update the controller call to pass `userId`:

```typescript
// In cvs.controller.ts, the PATCH route:
@Patch(':id')
update(@Param('id') id: string, @Body() body: unknown, @Req() req: AuthenticatedRequest) {
  const data = updateCvSchema.parse(body);
  return this.cvs.update(id, req.user.sub, data);
}
```

- [x] **Step 4: Run test — verify it passes**

```bash
cd backend && npx jest cvs.service.spec.ts --no-coverage
```

Expected: PASS.

- [x] **Step 5: Full backend test suite**

```bash
cd backend && npm test
```

Expected: all tests pass.

- [x] **Step 6: Commit**

```bash
git add backend/src/cvs
git commit -m "Fix PATCH /cvs/:id — add ownership check to prevent unauthorized rename"
```

---

## Task 7: Frontend — ConfirmDeleteModalComponent (shared)

**Files:**
- Create: `frontend/src/app/shared/components/confirm-delete-modal/` (4 files via CLI)

- [x] **Step 1: Generate component**

```bash
cd frontend && ng generate component shared/components/confirm-delete-modal --standalone
```

- [x] **Step 2: Write spec first**

In `frontend/src/app/shared/components/confirm-delete-modal/confirm-delete-modal.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { ConfirmDeleteModalComponent } from './confirm-delete-modal.component';

describe('ConfirmDeleteModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDeleteModalComponent],
    }).compileComponents();
  });

  it('does not render dialog when open is false', () => {
    const fixture = TestBed.createComponent(ConfirmDeleteModalComponent);
    fixture.componentRef.setInput('open', false);
    fixture.componentRef.setInput('title', 'Delete?');
    fixture.componentRef.setInput('body', 'Are you sure?');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('renders dialog when open is true', () => {
    const fixture = TestBed.createComponent(ConfirmDeleteModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Wirklich löschen?');
    fixture.componentRef.setInput('body', 'Nicht rückgängig machbar.');
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).not.toBeNull();
    expect(dialog.textContent).toContain('Wirklich löschen?');
  });

  it('emits confirmed when confirm button clicked', () => {
    const fixture = TestBed.createComponent(ConfirmDeleteModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Löschen?');
    fixture.componentRef.setInput('body', 'Sicher?');
    fixture.detectChanges();
    const confirmed = jest.fn();
    fixture.componentInstance.confirmed.subscribe(confirmed);
    fixture.nativeElement.querySelector('.modal__confirm').click();
    expect(confirmed).toHaveBeenCalled();
  });

  it('emits cancelled when cancel button clicked', () => {
    const fixture = TestBed.createComponent(ConfirmDeleteModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'Löschen?');
    fixture.componentRef.setInput('body', 'Sicher?');
    fixture.detectChanges();
    const cancelled = jest.fn();
    fixture.componentInstance.cancelled.subscribe(cancelled);
    fixture.nativeElement.querySelector('.modal__cancel').click();
    expect(cancelled).toHaveBeenCalled();
  });

  it('has role="dialog" and aria-modal="true" when open', () => {
    const fixture = TestBed.createComponent(ConfirmDeleteModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.componentRef.setInput('title', 'T');
    fixture.componentRef.setInput('body', 'B');
    fixture.detectChanges();
    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
  });
});
```

- [x] **Step 3: Run spec — verify it fails**

```bash
cd frontend && npx jest confirm-delete-modal --no-coverage
```

Expected: FAIL.

- [x] **Step 4: Implement the component TS**

In `frontend/src/app/shared/components/confirm-delete-modal/confirm-delete-modal.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'lba-confirm-delete-modal',
  standalone: true,
  imports: [],
  templateUrl: './confirm-delete-modal.component.html',
  styleUrl: './confirm-delete-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDeleteModalComponent {
  readonly open = input.required<boolean>();
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  readonly confirmLabel = input<string>('Ja, löschen');
  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  onConfirm(): void { this.confirmed.emit(); }
  onCancel(): void { this.cancelled.emit(); }
}
```

- [x] **Step 5: Implement the template**

In `frontend/src/app/shared/components/confirm-delete-modal/confirm-delete-modal.component.html`:

```html
@if (open()) {
  <div class="modal-backdrop" role="presentation" (click)="onCancel()" (keydown.escape)="onCancel()" tabindex="-1">
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      class="modal"
      (click)="$event.stopPropagation()"
    >
      <h2 id="delete-modal-title" class="modal__title">{{ title() }}</h2>
      <p class="modal__body">{{ body() }}</p>
      <div class="modal__actions">
        <button type="button" class="btn btn--ghost modal__cancel" (click)="onCancel()">Abbrechen</button>
        <button type="button" class="btn btn--danger modal__confirm" (click)="onConfirm()">{{ confirmLabel() }}</button>
      </div>
    </div>
  </div>
}
```

- [x] **Step 6: Add SCSS**

In `frontend/src/app/shared/components/confirm-delete-modal/confirm-delete-modal.component.scss`:

```scss
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  padding: var(--space-6);
  background: oklch(20% 0.015 270 / 0.45);
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  width: min(100%, 400px);
  box-shadow: var(--shadow-lg);
}

.modal__title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--ink);
  margin-bottom: var(--space-3);
}

.modal__body {
  font-size: 0.875rem;
  color: var(--ink-2);
  line-height: 1.6;
  margin-bottom: var(--space-6);
}

.modal__actions {
  display: flex;
  gap: var(--space-3);
  justify-content: flex-end;
}
```

- [x] **Step 7: Run spec — verify it passes**

```bash
cd frontend && npx jest confirm-delete-modal --no-coverage
```

Expected: PASS.

- [x] **Step 8: Commit**

```bash
git add frontend/src/app/shared/components/confirm-delete-modal
git commit -m "Add ConfirmDeleteModalComponent shared component"
```

---

## Task 8: Frontend — UpgradeModalComponent (shared)

**Files:**
- Create: `frontend/src/app/shared/components/upgrade-modal/` (4 files via CLI)

- [x] **Step 1: Generate component**

```bash
cd frontend && ng generate component shared/components/upgrade-modal --standalone
```

- [x] **Step 2: Write spec first**

In `frontend/src/app/shared/components/upgrade-modal/upgrade-modal.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { UpgradeModalComponent } from './upgrade-modal.component';

describe('UpgradeModalComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpgradeModalComponent],
    }).compileComponents();
  });

  it('renders plan cards when open', () => {
    const fixture = TestBed.createComponent(UpgradeModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.plan-card');
    expect(cards.length).toBe(2);
  });

  it('emits dismissed when "Vielleicht später" clicked', () => {
    const fixture = TestBed.createComponent(UpgradeModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const dismissed = jest.fn();
    fixture.componentInstance.dismissed.subscribe(dismissed);
    fixture.nativeElement.querySelector('.btn--dismiss').click();
    expect(dismissed).toHaveBeenCalled();
  });

  it('emits upgradeRequested when upgrade button clicked', () => {
    const fixture = TestBed.createComponent(UpgradeModalComponent);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    const upgradeRequested = jest.fn();
    fixture.componentInstance.upgradeRequested.subscribe(upgradeRequested);
    fixture.nativeElement.querySelector('.btn--upgrade').click();
    expect(upgradeRequested).toHaveBeenCalled();
  });
});
```

- [x] **Step 3: Run spec — verify it fails**

```bash
cd frontend && npx jest upgrade-modal --no-coverage
```

- [x] **Step 4: Implement component TS**

In `frontend/src/app/shared/components/upgrade-modal/upgrade-modal.component.ts`:

```typescript
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'lba-upgrade-modal',
  standalone: true,
  imports: [],
  templateUrl: './upgrade-modal.component.html',
  styleUrl: './upgrade-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpgradeModalComponent {
  readonly open = input.required<boolean>();
  readonly upgradeRequested = output<void>();
  readonly dismissed = output<void>();

  onUpgrade(): void { this.upgradeRequested.emit(); }
  onDismiss(): void { this.dismissed.emit(); }
}
```

- [x] **Step 5: Implement template**

In `frontend/src/app/shared/components/upgrade-modal/upgrade-modal.component.html`:

```html
@if (open()) {
  <div class="modal-backdrop" role="presentation" (click)="onDismiss()" (keydown.escape)="onDismiss()" tabindex="-1">
    <div role="dialog" aria-modal="true" aria-labelledby="upgrade-title" class="modal" (click)="$event.stopPropagation()">
      <h2 id="upgrade-title" class="modal__title">Dein Free-Limit ist erreicht</h2>
      <p class="modal__body">Du hast deine kostenlose Bewerbung bereits erstellt. Wähle einen Plan um unbegrenzt Bewerbungen zu optimieren.</p>
      <div class="upgrade-plans">
        <div class="plan-card">
          <div class="plan-card__name">Pay-per-App</div>
          <div class="plan-card__price">€2,49</div>
          <div class="plan-card__desc">Pro Bewerbung · Kein Abo</div>
        </div>
        <div class="plan-card plan-card--popular">
          <div class="plan-card__name">Pro</div>
          <div class="plan-card__price">€9,99</div>
          <div class="plan-card__desc">pro Monat · Unbegrenzt</div>
        </div>
      </div>
      <button type="button" class="btn btn--primary btn--upgrade" (click)="onUpgrade()">Plan wählen und upgraden</button>
      <button type="button" class="btn btn--ghost btn--dismiss" (click)="onDismiss()">Vielleicht später</button>
    </div>
  </div>
}
```

- [x] **Step 6: Add SCSS**

In `frontend/src/app/shared/components/upgrade-modal/upgrade-modal.component.scss`:

```scss
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  padding: var(--space-6);
  background: oklch(20% 0.015 270 / 0.45);
  backdrop-filter: blur(4px);
}

.modal {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  padding: var(--space-8);
  width: min(100%, 460px);
  box-shadow: var(--shadow-lg);
  text-align: center;
}

.modal__title {
  font-size: 1.25rem;
  font-weight: 800;
  color: var(--ink);
  margin-bottom: var(--space-3);
  letter-spacing: -0.02em;
}

.modal__body {
  font-size: 0.875rem;
  color: var(--ink-2);
  line-height: 1.6;
  margin-bottom: var(--space-6);
}

.upgrade-plans {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

.plan-card {
  border: 2px solid var(--line);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  text-align: left;
}

.plan-card--popular {
  border-color: var(--accent);
  background: oklch(97% 0.025 255);
}

.plan-card__name {
  font-size: 0.8125rem;
  font-weight: 700;
  color: var(--ink);
}

.plan-card__price {
  font-size: 1.375rem;
  font-weight: 800;
  color: var(--accent);
  margin: var(--space-1) 0;
  letter-spacing: -0.03em;
}

.plan-card__desc {
  font-size: 0.6875rem;
  color: var(--ink-3);
}

.btn--upgrade {
  width: 100%;
  margin-bottom: var(--space-3);
}

.btn--dismiss {
  width: 100%;
  color: var(--ink-3);
  font-size: 0.8125rem;
}
```

- [x] **Step 7: Run spec — verify it passes**

```bash
cd frontend && npx jest upgrade-modal --no-coverage
```

- [x] **Step 8: Commit**

```bash
git add frontend/src/app/shared/components/upgrade-modal
git commit -m "Add UpgradeModalComponent shared component"
```

---

## Task 9: Frontend — Dashboard enhancements

**Files:**
- Modify: `frontend/src/app/features/dashboard/dashboard.component.ts`
- Modify: `frontend/src/app/features/dashboard/dashboard.component.html`
- Modify: `frontend/src/app/features/dashboard/dashboard.component.scss`
- Modify: `frontend/src/app/features/dashboard/dashboard.component.spec.ts`

Changes needed:
1. Add third stat card: Ø Match-Score (uses `avgMatchScore` from dashboard API)
2. Add company column to the table
3. Add delete button per row (opens ConfirmDeleteModal)
4. Add inline status toggle per row (OPEN/DONE)

- [ ] **Step 1: Write failing tests**

In `frontend/src/app/features/dashboard/dashboard.component.spec.ts`, replace/extend the existing tests:

```typescript
import { TestBed } from '@angular/core/testing';
import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../../core/api/api.service';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

const mockApi = {
  get: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [{ provide: ApiService, useValue: mockApi }],
    }).overrideComponent(DashboardComponent, {
      remove: { imports: [RouterLink] },
      add: { imports: [RouterLink] },
    }).compileComponents();
    jest.clearAllMocks();
  });

  it('shows loading skeletons while fetching', () => {
    mockApi.get.mockReturnValue(new Promise(() => {}));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.loading()).toBe(true);
    expect(fixture.nativeElement.querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('shows error in aria-live region on API failure', async () => {
    mockApi.get.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Fehler' }, status: 500 }));
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toBe('Fehler');
    expect(fixture.nativeElement.querySelector('[aria-live]').textContent).toContain('Fehler');
  });

  it('renders three stat cards including avgMatchScore', async () => {
    mockApi.get.mockResolvedValue({ cvCount: 2, applicationCount: 3, avgMatchScore: 85, recentApplications: [] });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const cards = fixture.nativeElement.querySelectorAll('.stat-card');
    expect(cards.length).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('85%');
  });

  it('shows em-dash for avgMatchScore when null', async () => {
    mockApi.get.mockResolvedValue({ cvCount: 0, applicationCount: 0, avgMatchScore: null, recentApplications: [] });
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('—');
  });

  it('calls DELETE /applications/:id when delete confirmed', async () => {
    mockApi.get.mockResolvedValue({
      cvCount: 1, applicationCount: 1, avgMatchScore: 80,
      recentApplications: [{ id: 'app-1', status: 'OPEN', matchScore: 80, createdAt: '2026-05-10T00:00:00Z', jobPosting: { parsedJson: { title: 'Dev', company: 'Acme' } } }],
    });
    mockApi.delete.mockResolvedValue({});
    const fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    fixture.componentInstance.requestDelete('app-1');
    fixture.detectChanges();
    expect(fixture.componentInstance.deletingId()).toBe('app-1');

    await fixture.componentInstance.confirmDelete();
    expect(mockApi.delete).toHaveBeenCalledWith('/applications/app-1');
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd frontend && npx jest dashboard.component.spec.ts --no-coverage
```

- [ ] **Step 3: Update DashboardComponent TypeScript**

Replace `frontend/src/app/features/dashboard/dashboard.component.ts`:

```typescript
import { type OnInit, Component, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { ConfirmDeleteModalComponent } from '../../shared/components/confirm-delete-modal/confirm-delete-modal.component';

interface RecentApplication {
  id: string;
  status: string;
  matchScore: number | null;
  createdAt: string;
  jobPosting: { parsedJson: { title?: string; company?: string } };
}

interface DashboardData {
  cvCount: number;
  applicationCount: number;
  avgMatchScore: number | null;
  recentApplications: RecentApplication[];
}

@Component({
  selector: 'lba-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, ConfirmDeleteModalComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly data = signal<DashboardData | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.data.set(await this.api.get<DashboardData>('/users/me/dashboard'));
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Daten konnten nicht geladen werden.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  scoreClass(score: number): string {
    if (score >= 80) return 'score--high';
    if (score >= 60) return 'score--mid';
    return 'score--low';
  }

  statusLabel(status: string): string {
    const labels: Record<string, string> = {
      DRAFT: 'Wird optimiert…',
      OPEN: 'Offen',
      DONE: 'Erledigt',
      EXPORTED: 'Exportiert',
      SENT: 'Gesendet',
      REPLIED: 'Antwort',
      INTERVIEW: 'Interview',
      REJECTED: 'Abgelehnt',
      OFFER: 'Angebot',
    };
    return labels[status] ?? status;
  }

  requestDelete(id: string): void {
    this.deletingId.set(id);
    this.deleteError.set(null);
  }

  cancelDelete(): void {
    this.deletingId.set(null);
  }

  async confirmDelete(): Promise<void> {
    const id = this.deletingId();
    if (!id) return;
    try {
      await this.api.delete(`/applications/${id}`);
      this.data.update(d => d ? {
        ...d,
        applicationCount: d.applicationCount - 1,
        recentApplications: d.recentApplications.filter(a => a.id !== id),
      } : d);
      this.deletingId.set(null);
    } catch (e: unknown) {
      this.deleteError.set(e instanceof HttpErrorResponse ? e.error.message : 'Löschen fehlgeschlagen.');
      this.deletingId.set(null);
    }
  }

  async toggleStatus(app: RecentApplication): Promise<void> {
    const newStatus = app.status === 'DONE' ? 'OPEN' : 'DONE';
    try {
      await this.api.patch(`/applications/${app.id}`, { status: newStatus });
      this.data.update(d => d ? {
        ...d,
        recentApplications: d.recentApplications.map(a => a.id === app.id ? { ...a, status: newStatus } : a),
      } : d);
    } catch {
      // revert is implicit since signal state didn't change yet
    }
  }
}
```

- [ ] **Step 4: Update dashboard template**

Replace `frontend/src/app/features/dashboard/dashboard.component.html`:

```html
<main id="main" class="dashboard" [attr.aria-busy]="loading()">
  <header class="dashboard__header">
    <h1>Dashboard</h1>
    <a routerLink="/app/wizard" class="btn btn--primary btn--md">Neue Bewerbung</a>
  </header>

  @if (error()) {
    <div role="alert" aria-live="polite" class="form-error">{{ error() }}</div>
  }

  @if (deleteError()) {
    <div role="alert" aria-live="polite" class="form-error">{{ deleteError() }}</div>
  }

  @if (loading()) {
    <div class="stat-cards" aria-label="Statistiken werden geladen">
      <div class="stat-card stat-card--skeleton" aria-hidden="true"></div>
      <div class="stat-card stat-card--skeleton" aria-hidden="true"></div>
      <div class="stat-card stat-card--skeleton" aria-hidden="true"></div>
    </div>
  } @else if (data()) {
    <div class="stat-cards">
      <article class="stat-card" aria-label="Lebensläufe">
        <span class="stat-card__value">{{ data()!.cvCount }}</span>
        <span class="stat-card__label">Lebensläufe</span>
      </article>
      <article class="stat-card" aria-label="Bewerbungen">
        <span class="stat-card__value">{{ data()!.applicationCount }}</span>
        <span class="stat-card__label">Bewerbungen</span>
      </article>
      <article class="stat-card" aria-label="Durchschnittlicher Match-Score">
        <span class="stat-card__value">{{ data()!.avgMatchScore !== null ? (data()!.avgMatchScore + '%') : '—' }}</span>
        <span class="stat-card__label">Ø Match-Score</span>
      </article>
    </div>

    @if (data()!.recentApplications.length > 0) {
      <section aria-label="Letzte Bewerbungen">
        <h2>Letzte Bewerbungen</h2>
        <table class="app-table" role="grid">
          <caption class="sr-only">Letzte 5 Bewerbungen</caption>
          <thead>
            <tr>
              <th scope="col">Unternehmen</th>
              <th scope="col">Stelle</th>
              <th scope="col">Match-Score</th>
              <th scope="col">Status</th>
              <th scope="col">Erstellt</th>
              <th scope="col">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            @for (app of data()!.recentApplications; track app.id) {
              <tr>
                <td>{{ app.jobPosting.parsedJson.company ?? '–' }}</td>
                <td>{{ app.jobPosting.parsedJson.title ?? '–' }}</td>
                <td>
                  @if (app.matchScore !== null) {
                    <span [class]="'score ' + scoreClass(app.matchScore!)"
                      [attr.aria-label]="app.matchScore + '% Match-Score'">
                      {{ app.matchScore }}%
                    </span>
                  } @else {
                    <span aria-label="Score wird berechnet">–</span>
                  }
                </td>
                <td>
                  @if (app.status === 'OPEN' || app.status === 'DONE') {
                    <button
                      type="button"
                      class="status-toggle"
                      [class.status-toggle--done]="app.status === 'DONE'"
                      [attr.aria-pressed]="app.status === 'DONE'"
                      [attr.aria-label]="'Status: ' + statusLabel(app.status) + ' — klicken zum Ändern'"
                      (click)="toggleStatus(app)">
                      {{ statusLabel(app.status) }}
                    </button>
                  } @else {
                    <span>{{ statusLabel(app.status) }}</span>
                  }
                </td>
                <td><time [attr.datetime]="app.createdAt">{{ app.createdAt | date:'dd.MM.yyyy' }}</time></td>
                <td class="actions-cell">
                  <a [routerLink]="['/app/applications', app.id]" class="btn btn--ghost btn--sm">Öffnen</a>
                  <button
                    type="button"
                    class="btn btn--ghost btn--sm btn--danger-ghost"
                    [attr.aria-label]="'Bewerbung bei ' + (app.jobPosting.parsedJson.company ?? 'unbekannt') + ' löschen'"
                    (click)="requestDelete(app.id)">
                    Löschen
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </section>
    } @else {
      <section class="empty-state" aria-label="Keine Bewerbungen">
        <p>Du hast noch keine Bewerbungen erstellt.</p>
        <a routerLink="/app/wizard" class="btn btn--primary btn--md">Erste Bewerbung starten</a>
      </section>
    }
  }
</main>

<lba-confirm-delete-modal
  [open]="deletingId() !== null"
  title="Bewerbung löschen?"
  body="Diese Aktion kann nicht rückgängig gemacht werden."
  (confirmed)="confirmDelete()"
  (cancelled)="cancelDelete()"
/>
```

- [ ] **Step 5: Add status-toggle and actions styles to dashboard.component.scss**

Append to `frontend/src/app/features/dashboard/dashboard.component.scss`:

```scss
.stat-cards {
  grid-template-columns: repeat(3, 1fr);
}

.actions-cell {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.status-toggle {
  background: var(--warn-tint, oklch(96% 0.05 60));
  color: oklch(42% 0.16 60);
  border: 1px solid oklch(78% 0.14 60);
  border-radius: var(--radius-full);
  padding: var(--space-1) var(--space-3);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, color 0.15s;

  &--done {
    background: var(--good-tint, oklch(95% 0.04 155));
    color: oklch(40% 0.14 155);
    border-color: oklch(74% 0.12 155);
  }
}

.btn--danger-ghost {
  color: var(--danger, oklch(60% 0.18 25));

  &:hover {
    background: oklch(96% 0.04 25);
  }
}
```

- [ ] **Step 6: Run tests**

```bash
cd frontend && npx jest dashboard.component.spec.ts --no-coverage
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/features/dashboard
git commit -m "Dashboard: add avg match-score card, company column, delete modal, status toggle"
```

---

## Task 10: Frontend — Editor: Cover letter cards + download buttons + status toggle + regeneration confirm

**Files:**
- Modify: `frontend/src/app/features/application-editor/editor.component.ts`
- Modify: `frontend/src/app/features/application-editor/editor.component.html`
- Modify: `frontend/src/app/features/application-editor/editor.component.scss`
- Modify: `frontend/src/app/features/application-editor/editor.component.spec.ts`

Changes:
1. Replace letter tabs with 3 side-by-side cards (all 3 always visible)
2. Add letter/bundle download buttons
3. Replace "Als gesendet markieren" with Offen/Erledigt toggle
4. Add confirm dialog before regeneration
5. Wire `chosenVariant` PATCH on letter card selection

- [x] **Step 1: Update editor TypeScript**

Replace the relevant parts of `frontend/src/app/features/application-editor/editor.component.ts`. Key changes to `EditorComponent`:

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import type { OnInit, OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { ConfirmDeleteModalComponent } from '../../shared/components/confirm-delete-modal/confirm-delete-modal.component';

type LetterVariant = 'formal' | 'warm' | 'brief';

// ... existing interfaces unchanged ...

@Component({
  selector: 'lba-editor',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ConfirmDeleteModalComponent],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements OnInit, OnDestroy {
  // ... existing signals unchanged ...
  readonly regenConfirmOpen = signal(false);

  // ... existing methods unchanged ...

  async selectLetter(variant: LetterVariant): Promise<void> {
    this.selectedLetter.set(variant);
    await this.patchApplication({ chosenVariant: variant });
  }

  async setStatus(status: 'OPEN' | 'DONE'): Promise<void> {
    await this.patchApplication({ status });
    this.application.update(a => a ? { ...a, status } : a);
  }

  openRegenConfirm(): void {
    this.regenConfirmOpen.set(true);
  }

  async confirmRegen(): Promise<void> {
    this.regenConfirmOpen.set(false);
    if (!this.id) return;
    this.generating.set(true);
    this.error.set(null);
    try {
      await this.api.post(`/applications/${this.id}/regenerate-letter`, {});
      this.schedulePoll(0);
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Neu-Generierung fehlgeschlagen.');
      this.generating.set(false);
    }
  }

  async downloadLetter(): Promise<void> {
    if (!this.id) return;
    this.downloading.set(true);
    try {
      const blob = await this.api.getBlob(`/applications/${this.id}/pdf/letter`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'Anschreiben.pdf';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Download fehlgeschlagen.');
    } finally {
      this.downloading.set(false);
    }
  }

  async downloadBundle(): Promise<void> {
    if (!this.id) return;
    this.downloading.set(true);
    try {
      const blob = await this.api.getBlob(`/applications/${this.id}/pdf/bundle`);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'Bewerbung.zip';
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Download fehlgeschlagen.');
    } finally {
      this.downloading.set(false);
    }
  }
}
```

- [x] **Step 2: Update editor template**

Update the letter section in `frontend/src/app/features/application-editor/editor.component.html`. Replace the `<aside class="panel panel--letter">` block and the header actions:

```html
<!-- Replace header actions -->
<div class="editor__actions" role="group" aria-label="Bewerbungsaktionen">
  <button class="btn btn--secondary btn--sm" type="button" (click)="downloadPdf()" [disabled]="isDownloading()">
    {{ isDownloading() ? 'PDF wird erstellt…' : 'CV als PDF' }}
  </button>
  <button class="btn btn--secondary btn--sm" type="button" (click)="downloadLetter()" [disabled]="isDownloading()">
    Anschreiben als PDF
  </button>
  <button class="btn btn--primary btn--sm" type="button" (click)="downloadBundle()" [disabled]="isDownloading()">
    Beide herunterladen
  </button>
</div>

<!-- Replace "Als gesendet markieren" with status toggle -->
<div class="status-toggle-row" role="group" aria-label="Bewerbungsstatus">
  <span class="status-toggle-row__label">Status:</span>
  <button
    type="button"
    class="btn btn--sm"
    [class.btn--primary]="application()?.status === 'OPEN'"
    [class.btn--ghost]="application()?.status !== 'OPEN'"
    [attr.aria-pressed]="application()?.status === 'OPEN'"
    (click)="setStatus('OPEN')">
    Offen
  </button>
  <button
    type="button"
    class="btn btn--sm"
    [class.btn--primary]="application()?.status === 'DONE'"
    [class.btn--ghost]="application()?.status !== 'DONE'"
    [attr.aria-pressed]="application()?.status === 'DONE'"
    (click)="setStatus('DONE')">
    Erledigt
  </button>
</div>

<!-- Replace letter tabs with 3-column cards -->
<section class="panel panel--letters" aria-labelledby="letters-title">
  <div class="letters-header">
    <h2 id="letters-title">Anschreiben — wähle deine Variante</h2>
    <button type="button" class="btn btn--ghost btn--sm" (click)="openRegenConfirm()">
      Anschreiben neu generieren
    </button>
  </div>
  <div class="letters-grid">
    @for (variant of (['formal', 'warm', 'brief'] as const); track variant) {
      <div
        class="letter-card"
        [class.letter-card--chosen]="selectedLetterValue() === variant"
        [attr.aria-label]="'Anschreiben-Variante ' + variantLabel(variant)">
        <div class="letter-card__header">
          <span class="letter-card__label">{{ variantLabel(variant) }}</span>
          @if (selectedLetterValue() === variant) {
            <span class="letter-card__chosen-badge" aria-label="Gewählt">Gewählt</span>
          }
        </div>
        <label [for]="'letter-' + variant" class="sr-only">{{ variantLabel(variant) }} Anschreiben</label>
        <textarea
          [id]="'letter-' + variant"
          [formControl]="editorForm.controls[variant]"
          rows="10"
          class="letter-card__textarea"
          (blur)="saveCoverLetter()"
          [attr.aria-describedby]="selectedLetterValue() === variant ? 'chosen-letter-hint' : null"
        ></textarea>
        @if (selectedLetterValue() !== variant) {
          <button
            type="button"
            class="btn btn--ghost btn--sm letter-card__select"
            (click)="selectLetter(variant)">
            Auswählen
          </button>
        }
      </div>
    }
  </div>
  <p id="chosen-letter-hint" class="sr-only">Diese Variante wird beim PDF-Export verwendet.</p>
</section>

<!-- Regeneration confirm modal -->
<lba-confirm-delete-modal
  [open]="regenConfirmOpen()"
  title="Anschreiben neu generieren?"
  body="Alle 3 Varianten werden neu erstellt. Deine manuellen Änderungen gehen verloren."
  confirmLabel="Ja, neu generieren"
  (confirmed)="confirmRegen()"
  (cancelled)="regenConfirmOpen.set(false)"
/>
```

- [x] **Step 3: Add variantLabel() helper to EditorComponent TypeScript**

```typescript
variantLabel(variant: LetterVariant): string {
  return { formal: 'Formal', warm: 'Freundlich', brief: 'Knapp' }[variant];
}
```

- [x] **Step 4: Update populateForm() to set chosenVariant signal**

In `populateForm()`, after setting form values, also set selectedLetter:

```typescript
private populateForm(app: ApplicationDto): void {
  const letters = app.coverLetter as Record<string, string> | undefined;
  this.editorForm.patchValue({
    cvText: typeof (app.optimizedCv as { text?: unknown })?.text === 'string'
      ? (app.optimizedCv as { text: string }).text
      : JSON.stringify(app.optimizedCv ?? {}),
    formal: letters?.['formal'] ?? '',
    warm: letters?.['warm'] ?? '',
    brief: letters?.['brief'] ?? '',
  });
  if (app.chosenVariant && ['formal', 'warm', 'brief'].includes(app.chosenVariant)) {
    this.selectedLetter.set(app.chosenVariant as LetterVariant);
  }
}
```

Also add `chosenVariant` to the `ApplicationDto` interface:

```typescript
interface ApplicationDto {
  id: string;
  status?: string;
  matchScore?: number | null;
  atsScore?: number | null;
  optimizedCv?: unknown;
  coverLetter?: Record<string, string>;
  matchReport?: MatchReport;
  chosenVariant?: string;
  jobPosting?: { parsedJson?: { title?: string; company?: string; keywords?: string[] } };
}
```

- [x] **Step 5: Add letters-grid and letter-card styles to editor.component.scss**

Append to `frontend/src/app/features/application-editor/editor.component.scss`:

```scss
.letters-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-4);
}

.letters-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-4);
}

.letter-card {
  border: 2px solid var(--line);
  border-radius: var(--radius-md);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: border-color 0.15s;

  &--chosen {
    border-color: var(--accent);
    background: oklch(97% 0.025 255);
  }
}

.letter-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.letter-card__label {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--ink-3);
}

.letter-card__chosen-badge {
  background: var(--accent);
  color: var(--accent-ink, white);
  font-size: 0.625rem;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-weight: 700;
}

.letter-card__textarea {
  flex: 1;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  padding: var(--space-3);
  font-size: 0.75rem;
  color: var(--ink-2);
  font-family: var(--font-sans);
  resize: none;
  line-height: 1.6;
  background: var(--bg);

  &:focus { border-color: var(--accent); outline: none; }
}

.letter-card__select {
  width: 100%;
}

.status-toggle-row {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) 0;
  border-top: 1px solid var(--line);
  margin-top: var(--space-4);

  &__label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--ink-2);
  }
}
```

- [x] **Step 6: Build frontend**

```bash
cd frontend && npm run build
```

Expected: exit 0.

- [x] **Step 7: Write and run editor spec updates**

Update `editor.component.spec.ts` to test the new `selectLetter()`, `setStatus()`, and `openRegenConfirm()` methods. Key new tests:

```typescript
it('selectLetter sets selectedLetter and calls PATCH with chosenVariant', async () => {
  // mock api.get for load(), mock api.patch for selectLetter
  mockApi.get.mockResolvedValue(/* app with optimizedCv */);
  mockApi.patch.mockResolvedValue({});
  // ... create fixture, load, call selectLetter('warm')
  // expect selectedLetter() === 'warm'
  // expect mockApi.patch called with { chosenVariant: 'warm' }
});
```

```bash
cd frontend && npx jest editor.component.spec.ts --no-coverage
```

- [x] **Step 8: Commit**

```bash
git add frontend/src/app/features/application-editor
git commit -m "Editor: 3 cover letter cards, letter/bundle download, status toggle, regen confirm"
```

---

## Task 11: Frontend — Wizard plan limit check

**Files:**
- Modify: `frontend/src/app/features/wizard/wizard.component.ts`
- Modify: `frontend/src/app/features/wizard/wizard.component.html`
- Modify: `frontend/src/app/features/wizard/wizard.component.spec.ts`

- [x] **Step 1: Add upgradeModalOpen signal and handle 402 in generate()**

In `frontend/src/app/features/wizard/wizard.component.ts`:

```typescript
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { UpgradeModalComponent } from '../../shared/components/upgrade-modal/upgrade-modal.component';

// MasterCv interface unchanged ...

@Component({
  selector: 'lba-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UpgradeModalComponent],
  templateUrl: './wizard.component.html',
  styleUrl: './wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardComponent implements OnInit {
  // ... existing fields unchanged ...
  readonly upgradeModalOpen = signal(false);

  // ... existing methods unchanged ...

  async generate(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const job = await this.api.post<{ id: string }>('/jobs/parse', {
        type: 'text',
        value: this.jobForm.value.jobRaw,
      });
      const app = await this.api.post<{ id: string }>('/applications', {
        masterCvId: this.selectedCvId(),
        jobPostingId: job.id,
      });
      await this.router.navigate(['/app/applications', app.id]);
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse && e.status === 402) {
        this.upgradeModalOpen.set(true);
      } else {
        this.error.set(
          e instanceof HttpErrorResponse ? e.error.message : 'Bewerbung konnte nicht erstellt werden.',
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  onUpgradeRequested(): void {
    this.upgradeModalOpen.set(false);
    void this.router.navigate(['/app/billing']);
  }
}
```

- [x] **Step 2: Add upgrade modal to wizard template**

In `frontend/src/app/features/wizard/wizard.component.html`, add at the end:

```html
<lba-upgrade-modal
  [open]="upgradeModalOpen()"
  (upgradeRequested)="onUpgradeRequested()"
  (dismissed)="upgradeModalOpen.set(false)"
/>
```

- [x] **Step 3: Write and run spec**

In `frontend/src/app/features/wizard/wizard.component.spec.ts`:

```typescript
it('shows upgrade modal when POST /applications returns 402', async () => {
  mockApi.post.mockImplementation((url: string) => {
    if (url === '/jobs/parse') return Promise.resolve({ id: 'job-1' });
    throw new HttpErrorResponse({ status: 402, error: { message: 'Plan limit', code: 'PLAN_LIMIT' } });
  });
  const fixture = TestBed.createComponent(WizardComponent);
  fixture.componentInstance.selectedCvId.set('cv-1');
  fixture.componentInstance.jobForm.setValue({ jobRaw: 'a'.repeat(60) });
  fixture.detectChanges();
  await fixture.componentInstance.generate();
  fixture.detectChanges();
  expect(fixture.componentInstance.upgradeModalOpen()).toBe(true);
});
```

```bash
cd frontend && npx jest wizard.component.spec.ts --no-coverage
```

Expected: PASS.

- [x] **Step 4: Commit**

```bash
git add frontend/src/app/features/wizard
git commit -m "Wizard: show upgrade modal on free plan limit (402 response)"
```

---

## Task 12: Frontend — CV Library enhancements

**Files:**
- Modify: `frontend/src/app/features/master-cvs/master-cvs.component.ts`
- Modify: `frontend/src/app/features/master-cvs/master-cvs.component.html`
- Modify: `frontend/src/app/features/master-cvs/master-cvs.component.spec.ts`

Changes: add "In Bewerbung verwenden" button, add inline rename, replace `window.confirm` delete with ConfirmDeleteModal.

- [x] **Step 1: Update component TypeScript**

In `frontend/src/app/features/master-cvs/master-cvs.component.ts`:

```typescript
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import type { OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { ConfirmDeleteModalComponent } from '../../shared/components/confirm-delete-modal/confirm-delete-modal.component';

interface MasterCv {
  id: string;
  name: string;
  language: string;
  sourceFilename: string;
  updatedAt: string;
}

@Component({
  selector: 'lba-master-cvs',
  standalone: true,
  imports: [DatePipe, RouterLink, ReactiveFormsModule, ConfirmDeleteModalComponent],
  templateUrl: './master-cvs.component.html',
  styleUrl: './master-cvs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterCvsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly cvs = signal<MasterCv[]>([]);
  readonly deletingId = signal<string | null>(null);
  readonly renamingId = signal<string | null>(null);
  readonly renameValue = signal('');

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.cvs.set(await this.api.get<MasterCv[]>('/cvs'));
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Lebensläufe konnten nicht geladen werden.');
    } finally {
      this.loading.set(false);
    }
  }

  async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set(null);
    try {
      const cv = await this.api.upload<MasterCv>('/cvs', file, 'file');
      this.cvs.update(list => [cv, ...list]);
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Upload fehlgeschlagen.');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  requestDelete(id: string): void {
    this.deletingId.set(id);
  }

  async confirmDelete(): Promise<void> {
    const id = this.deletingId();
    if (!id) return;
    try {
      await this.api.delete(`/cvs/${id}`);
      this.cvs.update(list => list.filter(c => c.id !== id));
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Löschen fehlgeschlagen.');
    } finally {
      this.deletingId.set(null);
    }
  }

  useInWizard(id: string): void {
    void this.router.navigate(['/app/wizard'], { queryParams: { cvId: id } });
  }

  startRename(cv: MasterCv): void {
    this.renamingId.set(cv.id);
    this.renameValue.set(cv.name);
  }

  async saveRename(cv: MasterCv): Promise<void> {
    const name = this.renameValue().trim();
    if (!name || name === cv.name) {
      this.renamingId.set(null);
      return;
    }
    try {
      await this.api.patch(`/cvs/${cv.id}`, { name });
      this.cvs.update(list => list.map(c => c.id === cv.id ? { ...c, name } : c));
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Umbenennen fehlgeschlagen.');
    } finally {
      this.renamingId.set(null);
    }
  }
}
```

- [x] **Step 2: Update CV library template**

Replace `frontend/src/app/features/master-cvs/master-cvs.component.html`:

```html
<main id="main" class="master-cvs" [attr.aria-busy]="loading() || uploading()">
  <header class="master-cvs__header">
    <h1>Meine Lebensläufe</h1>
    <label
      class="btn btn--primary btn--md"
      for="cv-upload"
      role="button"
      tabindex="0"
      [class.btn--loading]="uploading()"
      [attr.aria-disabled]="uploading()">
      @if (uploading()) { Wird hochgeladen… } @else { Lebenslauf hochladen }
      <input
        id="cv-upload"
        type="file"
        accept=".pdf,.docx"
        class="sr-only"
        [disabled]="uploading()"
        (change)="upload($event)"
        aria-label="Lebenslauf-Datei auswählen (PDF oder DOCX)" />
    </label>
  </header>

  @if (error()) {
    <div role="alert" aria-live="polite" class="form-error">{{ error() }}</div>
  }

  @if (loading()) {
    <ul class="cv-list" aria-label="Lebensläufe werden geladen" aria-busy="true">
      <li class="cv-card cv-card--skeleton" aria-hidden="true"></li>
      <li class="cv-card cv-card--skeleton" aria-hidden="true"></li>
    </ul>
  } @else if (cvs().length === 0) {
    <section class="empty-state" aria-label="Keine Lebensläufe">
      <p>Noch kein Lebenslauf hochgeladen.</p>
      <p>Lade einen Lebenslauf als PDF oder DOCX hoch, um zu starten.</p>
    </section>
  } @else {
    <ul class="cv-list" role="list" aria-label="Lebenslauf-Liste">
      @for (cv of cvs(); track cv.id) {
        <li class="cv-card">
          <div class="cv-card__info">
            @if (renamingId() === cv.id) {
              <input
                class="cv-card__rename-input"
                type="text"
                [value]="renameValue()"
                (input)="renameValue.set($any($event.target).value)"
                (blur)="saveRename(cv)"
                (keydown.enter)="saveRename(cv)"
                (keydown.escape)="renamingId.set(null)"
                [attr.aria-label]="'Neuer Name für ' + cv.name"
                autofocus
              />
            } @else {
              <strong class="cv-card__name">{{ cv.name }}</strong>
            }
            <span class="cv-card__meta">{{ cv.sourceFilename }} · {{ cv.language.toUpperCase() }}</span>
            <time class="cv-card__date" [attr.datetime]="cv.updatedAt">
              Aktualisiert {{ cv.updatedAt | date:'dd.MM.yyyy' }}
            </time>
          </div>
          <div class="cv-card__actions">
            <button
              type="button"
              class="btn btn--primary btn--sm"
              [attr.aria-label]="'Lebenslauf ' + cv.name + ' in Bewerbung verwenden'"
              (click)="useInWizard(cv.id)">
              In Bewerbung verwenden
            </button>
            <button
              type="button"
              class="btn btn--ghost btn--sm"
              [attr.aria-label]="'Lebenslauf ' + cv.name + ' umbenennen'"
              (click)="startRename(cv)">
              Umbenennen
            </button>
            <button
              type="button"
              class="btn btn--ghost btn--sm"
              [attr.aria-label]="'Lebenslauf ' + cv.name + ' löschen'"
              (click)="requestDelete(cv.id)">
              Löschen
            </button>
          </div>
        </li>
      }
    </ul>
  }
</main>

<lba-confirm-delete-modal
  [open]="deletingId() !== null"
  title="Lebenslauf löschen?"
  body="Dieser Lebenslauf wird dauerhaft gelöscht. Bestehende Bewerbungen sind nicht betroffen."
  (confirmed)="confirmDelete()"
  (cancelled)="deletingId.set(null)"
/>
```

- [x] **Step 3: Update wizard to accept cvId query param**

In `frontend/src/app/features/wizard/wizard.component.ts`, update `ngOnInit()`:

```typescript
import { ActivatedRoute } from '@angular/router';

// inject ActivatedRoute:
private readonly route = inject(ActivatedRoute);

async ngOnInit(): Promise<void> {
  try {
    const cvList = await this.api.get<MasterCv[]>('/cvs');
    this.cvs.set(cvList);

    // Pre-select CV if passed via query param (from CV library "use" button)
    const cvId = this.route.snapshot.queryParamMap.get('cvId');
    if (cvId && cvList.some(c => c.id === cvId)) {
      this.selectCv(cvId);
    }
  } catch {
    this.error.set('Lebensläufe konnten nicht geladen werden.');
  }
}
```

- [x] **Step 4: Write and run spec**

```bash
cd frontend && npx jest master-cvs.component.spec.ts --no-coverage
```

Key tests: `requestDelete` sets `deletingId`, `confirmDelete` calls DELETE API and removes from list, `useInWizard` navigates to `/app/wizard?cvId=...`, `startRename` sets `renamingId` and `renameValue`, `saveRename` calls PATCH and updates list.

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add frontend/src/app/features/master-cvs frontend/src/app/features/wizard
git commit -m "CV Library: add use-in-wizard button, inline rename, custom delete modal"
```

---

## Task 13: Full verification

- [ ] **Step 1: Backend lint**

```bash
cd backend && npm run lint
```

Expected: exit 0.

- [ ] **Step 2: Backend tests**

```bash
cd backend && npm test
```

Expected: exit 0, all tests pass.

- [ ] **Step 3: Frontend lint**

```bash
cd frontend && npm run lint
```

Expected: exit 0.

- [ ] **Step 4: Frontend tests**

```bash
cd frontend && npm test -- --watchAll=false
```

Expected: exit 0.

- [ ] **Step 5: Frontend build**

```bash
cd frontend && npm run build
```

Expected: exit 0.

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "Post-login app shell: all gaps closed, full verification passed"
```
