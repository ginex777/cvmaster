# AI Insights Tab — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Analyse" tab to the application editor showing a keyword match panel (score ring + colour-coded chips) and an AI change diff (before/after bullets with reason labels), powered by a new `optimizationDiff` field computed during the AI pipeline.

**Architecture:** Reuse the existing `MatchScoringService` (already computes score, matched/missing keywords, and risks) — no new scoring service needed. Extend the optimizer LLM output schema to include an optional `reason` per bullet, then compute a `DiffComputerService` (pure function) that compares original vs optimized CV bullets by ID and builds the diff array. The diff is persisted to `Application.optimizationDiff` and exposed to the frontend via the existing `GET /applications/:id` response. A new `AtsPanel` dumb component renders all three sections; the editor adds an "Analyse" tab that passes data down.

**Tech Stack:** NestJS + Prisma, Zod, Angular 21 (signals, OnPush), Jest

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `backend/prisma/schema.prisma` | Modify | Add `optimizationDiff Json?` field to Application |
| `backend/src/ai/provider.ts` | Modify | Add `reason?: string` to ParsedCVSchema bullet shape |
| `backend/prompts/optimizer.txt` | Modify | Instruct LLM to add `reason` per changed bullet |
| `backend/src/applications/diff-computer.service.ts` | Create | Pure `compute(originalCv, optimizedCv): DiffEntry[]` function |
| `backend/src/applications/diff-computer.service.spec.ts` | Create | Unit tests for DiffComputerService |
| `backend/src/queue/ai-pipeline.processor.ts` | Modify | Call DiffComputerService after optimizeCv, persist optimizationDiff |
| `backend/src/applications/applications.module.ts` | Modify | Register DiffComputerService |
| `frontend/src/app/features/application-editor/editor.component.ts` | Modify | Add `optimizationDiff` to ApplicationDto, add `activeTab` signal, expose ats data |
| `frontend/src/app/features/application-editor/editor.component.html` | Modify | Add tab bar + Analyse tab section with `<lba-ats-panel>` |
| `frontend/src/app/shared/components/ats-panel/ats-panel.component.ts` | Create | Dumb component: inputs score, matchReport, optimizationDiff |
| `frontend/src/app/shared/components/ats-panel/ats-panel.component.html` | Create | Score ring + keyword chips + diff entries |
| `frontend/src/app/shared/components/ats-panel/ats-panel.component.scss` | Create | Panel layout styles |
| `frontend/src/app/shared/components/ats-panel/ats-panel.component.spec.ts` | Create | Unit tests |

---

## Task 1: Add `optimizationDiff` to Prisma schema

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [ ] **Step 1: Write failing migration test** (none needed — Prisma migrations are verified by running `prisma migrate dev`. Skip to step 2.)

- [ ] **Step 2: Add field to schema**

In `backend/prisma/schema.prisma`, inside the `model Application { ... }` block, add after the `matchReport` field:

```prisma
model Application {
  // ... existing fields ...
  matchReport        Json?
  optimizationDiff   Json?   // Array<{ section: string, before: string, after: string, reason: string }>
  // ... rest of fields ...
}
```

- [ ] **Step 3: Generate migration and Prisma client**

```bash
cd backend
npx prisma migrate dev --name add_optimization_diff
npx prisma generate
```

Expected: migration file created in `prisma/migrations/`, Prisma client regenerated without error.

- [ ] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "Add optimizationDiff field to Application model"
```

---

## Task 2: Extend optimizer bullet schema with optional `reason`

**Files:**
- Modify: `backend/src/ai/provider.ts`
- Modify: `backend/prompts/optimizer.txt`

- [ ] **Step 1: Update ParsedCVSchema in provider.ts**

In `backend/src/ai/provider.ts`, find the bullet shape inside `ParsedCVSchema.experience` and add the optional `reason` field:

```typescript
// Before:
bullets: z.array(z.object({ id: z.string(), text: z.string() })),

// After:
bullets: z.array(z.object({
  id:     z.string(),
  text:   z.string(),
  reason: z.string().optional(),
})),
```

This is backward-compatible: the CV parser and quickstart generator don't return `reason`, so the field will just be absent.

- [ ] **Step 2: Update sanitizeCv to sanitize reason**

In `backend/src/queue/ai-pipeline.processor.ts`, find `sanitizeCv` and extend bullet sanitization:

```typescript
// Before:
bullets: e.bullets.map(b => ({ ...b, text: sanitizeText(b.text) })),

// After:
bullets: e.bullets.map(b => ({
  ...b,
  text:   sanitizeText(b.text),
  reason: b.reason ? sanitizeText(b.reason) : undefined,
})),
```

- [ ] **Step 3: Update optimizer prompt**

Open `backend/prompts/optimizer.txt`. At the end of the bullet output instructions (the section describing the JSON output format), add:

```
For each bullet you MODIFY (change text, not just reorder), add a "reason" field explaining the change in one sentence.
Bullets you did not change must NOT include a "reason" field.
Example: { "id": "abc", "text": "Improved Angular performance by 40%", "reason": "Added quantified result to strengthen ATS impact" }
```

- [ ] **Step 4: Run backend build to verify types compile**

```bash
cd backend
npm run build
```

Expected: exits 0, no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add backend/src/ai/provider.ts backend/src/queue/ai-pipeline.processor.ts backend/prompts/optimizer.txt
git commit -m "Add optional reason field to optimizer bullet schema and prompt"
```

---

## Task 3: DiffComputerService — pure function, unit tested

**Files:**
- Create: `backend/src/applications/diff-computer.service.ts`
- Create: `backend/src/applications/diff-computer.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `backend/src/applications/diff-computer.service.spec.ts`:

```typescript
import { DiffComputerService, DiffEntry } from './diff-computer.service';
import type { ParsedCV } from '../ai/provider';

describe('DiffComputerService', () => {
  let service: DiffComputerService;

  beforeEach(() => {
    service = new DiffComputerService();
  });

  function makeCv(bullets: Array<{ id: string; text: string; reason?: string }>): ParsedCV {
    return {
      name: 'Test',
      experience: [{
        id: 'exp1',
        company: 'Acme',
        role: 'Developer',
        bullets,
      }],
      education: [],
      skills: [],
      languages: [],
    };
  }

  it('returns empty array when no bullets changed', () => {
    const original = makeCv([{ id: 'b1', text: 'Built widgets' }]);
    const optimized = makeCv([{ id: 'b1', text: 'Built widgets' }]);
    expect(service.compute(original, optimized)).toEqual([]);
  });

  it('creates a diff entry when bullet text changed', () => {
    const original = makeCv([{ id: 'b1', text: 'Built widgets' }]);
    const optimized = makeCv([{ id: 'b1', text: 'Shipped 12 widgets, improving load time by 30%', reason: 'Added metrics' }]);
    const result = service.compute(original, optimized);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject<Partial<DiffEntry>>({
      section: 'Developer @ Acme',
      before:  'Built widgets',
      after:   'Shipped 12 widgets, improving load time by 30%',
      reason:  'Added metrics',
    });
  });

  it('uses empty string for reason when optimizer did not provide one', () => {
    const original = makeCv([{ id: 'b1', text: 'Old text' }]);
    const optimized = makeCv([{ id: 'b1', text: 'New text' }]);
    const result = service.compute(original, optimized);
    expect(result[0].reason).toBe('');
  });

  it('ignores bullets not present in original (new bullets added by optimizer)', () => {
    const original = makeCv([{ id: 'b1', text: 'Existing' }]);
    const optimized = makeCv([
      { id: 'b1', text: 'Existing' },
      { id: 'b2', text: 'New bullet added by AI', reason: 'New achievement' },
    ]);
    expect(service.compute(original, optimized)).toEqual([]);
  });

  it('handles multiple changed bullets across sections', () => {
    const original: ParsedCV = {
      name: 'Test',
      experience: [
        {
          id: 'exp1',
          company: 'Alpha',
          role: 'Dev',
          bullets: [
            { id: 'b1', text: 'Old 1' },
            { id: 'b2', text: 'Unchanged' },
          ],
        },
        {
          id: 'exp2',
          company: 'Beta',
          role: 'Lead',
          bullets: [{ id: 'b3', text: 'Old 3' }],
        },
      ],
      education: [],
      skills: [],
      languages: [],
    };
    const optimized: ParsedCV = {
      ...original,
      experience: [
        {
          id: 'exp1',
          company: 'Alpha',
          role: 'Dev',
          bullets: [
            { id: 'b1', text: 'New 1', reason: 'Quantified' },
            { id: 'b2', text: 'Unchanged' },
          ],
        },
        {
          id: 'exp2',
          company: 'Beta',
          role: 'Lead',
          bullets: [{ id: 'b3', text: 'New 3', reason: 'Impact added' }],
        },
      ],
    };
    const result = service.compute(original, optimized);
    expect(result).toHaveLength(2);
    expect(result[0].section).toBe('Dev @ Alpha');
    expect(result[1].section).toBe('Lead @ Beta');
  });

  it('clamps output to maximum 20 diff entries', () => {
    const bullets = Array.from({ length: 25 }, (_, i) => ({ id: `b${i}`, text: `Old ${i}` }));
    const optimizedBullets = bullets.map(b => ({ ...b, text: `New ${b.id}`, reason: 'Changed' }));
    const original = makeCv(bullets);
    const optimized = makeCv(optimizedBullets);
    expect(service.compute(original, optimized)).toHaveLength(20);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend
npx jest diff-computer --no-coverage
```

Expected: FAIL — `Cannot find module './diff-computer.service'`

- [ ] **Step 3: Implement DiffComputerService**

Create `backend/src/applications/diff-computer.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import type { ParsedCV } from '../ai/provider';

export interface DiffEntry {
  section: string;
  before:  string;
  after:   string;
  reason:  string;
}

const MAX_DIFF_ENTRIES = 20;

@Injectable()
export class DiffComputerService {
  compute(originalCv: ParsedCV, optimizedCv: ParsedCV): DiffEntry[] {
    const originalBullets = this.indexBullets(originalCv);
    const entries: DiffEntry[] = [];

    for (const exp of optimizedCv.experience ?? []) {
      const section = `${exp.role} @ ${exp.company}`;
      for (const bullet of exp.bullets ?? []) {
        const original = originalBullets.get(bullet.id);
        if (!original || original === bullet.text) continue;
        entries.push({
          section,
          before: original,
          after:  bullet.text,
          reason: bullet.reason ?? '',
        });
        if (entries.length >= MAX_DIFF_ENTRIES) return entries;
      }
    }

    return entries;
  }

  private indexBullets(cv: ParsedCV): Map<string, string> {
    const map = new Map<string, string>();
    for (const exp of cv.experience ?? []) {
      for (const bullet of exp.bullets ?? []) {
        map.set(bullet.id, bullet.text);
      }
    }
    return map;
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd backend
npx jest diff-computer --no-coverage
```

Expected: PASS — all 5 tests green.

- [ ] **Step 5: Commit**

```bash
git add backend/src/applications/diff-computer.service.ts backend/src/applications/diff-computer.service.spec.ts
git commit -m "Add DiffComputerService for CV before/after change tracking"
```

---

## Task 4: Wire DiffComputerService into the AI pipeline

**Files:**
- Modify: `backend/src/applications/applications.module.ts`
- Modify: `backend/src/queue/ai-pipeline.processor.ts`

- [ ] **Step 1: Register DiffComputerService in ApplicationsModule**

Open `backend/src/applications/applications.module.ts`. Add `DiffComputerService` to providers and exports:

```typescript
import { DiffComputerService } from './diff-computer.service';

@Module({
  // ...
  providers: [ApplicationsService, DiffComputerService],
  exports: [ApplicationsService, DiffComputerService],
})
export class ApplicationsModule {}
```

- [ ] **Step 2: Inject DiffComputerService in AiPipelineProcessor**

In `backend/src/queue/ai-pipeline.processor.ts`, add the import and constructor injection:

```typescript
import { DiffComputerService } from '../applications/diff-computer.service';

// In the constructor:
constructor(
  private prisma: PrismaService,
  private ai: AiService,
  private scoring: MatchScoringService,
  private diffComputer: DiffComputerService,
) {}
```

- [ ] **Step 3: Write failing integration test for pipeline persisting optimizationDiff**

In `backend/src/queue/ai-pipeline.processor.spec.ts` (create if not exists):

```typescript
import { Test } from '@nestjs/testing';
import { AiPipelineProcessor } from './ai-pipeline.processor';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { MatchScoringService } from '../match/match-scoring.service';
import { DiffComputerService } from '../applications/diff-computer.service';
import type { ParsedCV, ParsedJob } from '../ai/provider';

const mockOriginalCv: ParsedCV = {
  name: 'Anna',
  experience: [{ id: 'exp1', company: 'Acme', role: 'Dev', bullets: [{ id: 'b1', text: 'Old bullet' }] }],
  education: [], skills: [], languages: [],
};

const mockOptimizedCv: ParsedCV = {
  name: 'Anna',
  experience: [{ id: 'exp1', company: 'Acme', role: 'Dev', bullets: [{ id: 'b1', text: 'New bullet', reason: 'ATS improved' }] }],
  education: [], skills: ['TypeScript'], languages: [],
};

const mockJob: ParsedJob = {
  title: 'Dev', mustHaves: ['TypeScript'], niceToHaves: [], skills: [], responsibilities: [], language: 'de',
};

describe('AiPipelineProcessor — optimizationDiff', () => {
  let processor: AiPipelineProcessor;
  let mockPrisma: jest.Mocked<Pick<PrismaService, 'application'>>;
  let mockAiService: jest.Mocked<Pick<AiService, 'optimizeCv' | 'generateCoverLetter'>>;
  let mockDiffComputer: jest.Mocked<Pick<DiffComputerService, 'compute'>>;
  let updateSpy: jest.Mock;

  beforeEach(async () => {
    updateSpy = jest.fn().mockResolvedValue({});
    mockPrisma = {
      application: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          id: 'app1',
          userId: 'user1',
          masterCv: { parsedJson: mockOriginalCv },
          jobPosting: { parsedJson: mockJob },
        }),
        update: updateSpy,
      } as unknown as PrismaService['application'],
    };
    mockAiService = {
      optimizeCv: jest.fn().mockResolvedValue(mockOptimizedCv),
      generateCoverLetter: jest.fn().mockResolvedValue({ concise: 'A', warm: 'B', formal: 'C' }),
    };
    mockDiffComputer = {
      compute: jest.fn().mockReturnValue([{ section: 'Dev @ Acme', before: 'Old bullet', after: 'New bullet', reason: 'ATS improved' }]),
    };

    const module = await Test.createTestingModule({
      providers: [
        AiPipelineProcessor,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AiService, useValue: mockAiService },
        { provide: MatchScoringService, useClass: MatchScoringService },
        { provide: DiffComputerService, useValue: mockDiffComputer },
      ],
    }).compile();

    processor = module.get(AiPipelineProcessor);
    // Bypass Worker instantiation in onModuleInit
    jest.spyOn(processor as unknown as { onModuleInit(): void }, 'onModuleInit').mockImplementation(() => {});
  });

  it('persists optimizationDiff after optimizeCv completes', async () => {
    const fakeJob = {
      name: 'full-pipeline',
      data: { applicationId: 'app1' },
      updateProgress: jest.fn(),
    };

    // Access private method via type cast
    await (processor as unknown as { processFullPipeline(job: unknown): Promise<void> })
      .processFullPipeline(fakeJob);

    const updateCall = updateSpy.mock.calls.find(
      (call: unknown[]) => {
        const data = (call[0] as { data?: { optimizationDiff?: unknown } })?.data;
        return data && 'optimizationDiff' in data;
      }
    );
    expect(updateCall).toBeDefined();
    const updateData = (updateCall![0] as { data: { optimizationDiff: unknown } }).data;
    expect(updateData.optimizationDiff).toEqual([
      { section: 'Dev @ Acme', before: 'Old bullet', after: 'New bullet', reason: 'ATS improved' },
    ]);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

```bash
cd backend
npx jest ai-pipeline.processor --no-coverage
```

Expected: FAIL — `optimizationDiff` not found in update call data.

- [ ] **Step 5: Call DiffComputerService in processFullPipeline**

In `backend/src/queue/ai-pipeline.processor.ts`, update `processFullPipeline` to compute and persist the diff. Add the diff computation after `sanitizeCv` and include it in the final `prisma.application.update` call:

```typescript
private async processFullPipeline(job: Job) {
  const { applicationId } = job.data;

  const app = await this.prisma.application.findUniqueOrThrow({
    where: { id: applicationId },
    include: { masterCv: true, jobPosting: true },
  });

  const originalCv = app.masterCv.parsedJson as unknown as ParsedCV;
  const parsedJob = app.jobPosting.parsedJson as unknown as ParsedJob;

  await this.updateProgress(applicationId, job, 10);

  const auditContext = { userId: app.userId, applicationId };

  const rawOptimizedCv = await this.ai.optimizeCv(originalCv, parsedJob, auditContext);
  const guardedCv = filterHallucinatedSkills(rawOptimizedCv, originalCv);
  const optimizedCv = sanitizeCv(guardedCv);
  await this.updateProgress(applicationId, job, 50);

  // Compute diff before reasons are stripped from further processing
  let optimizationDiff: unknown[] = [];
  try {
    optimizationDiff = this.diffComputer.compute(originalCv, optimizedCv);
  } catch (err) {
    this.logger.error('DiffComputerService.compute failed — skipping diff', err);
  }

  const rawLetter = await this.ai.generateCoverLetter(optimizedCv, parsedJob, auditContext);
  const coverLetter = sanitizeLetter(rawLetter);
  await this.updateProgress(applicationId, job, 85);

  const result = this.scoring.score(optimizedCv, parsedJob);
  const matchReport = {
    summary:          result.summary,
    matchedKeywords:  result.matchedKeywords,
    missingKeywords:  result.missingKeywords,
    strengths:        result.strengths,
    risks:            result.risks,
  };

  await this.prisma.application.update({
    where: { id: applicationId },
    data: {
      optimizedCv,
      coverLetter,
      matchScore:       result.score,
      matchReport,
      optimizationDiff,
      status:           'OPEN',
      generationProgress: 100,
      generationError:  null,
    },
  });

  await job.updateProgress(100);
}
```

- [ ] **Step 6: Run tests**

```bash
cd backend
npx jest ai-pipeline.processor --no-coverage
```

Expected: PASS.

- [ ] **Step 7: Run full backend test suite**

```bash
cd backend
npm run lint && npm test
```

Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add backend/src/applications/applications.module.ts backend/src/queue/ai-pipeline.processor.ts backend/src/queue/ai-pipeline.processor.spec.ts
git commit -m "Compute and persist optimizationDiff in AI pipeline"
```

---

## Task 5: Expose optimizationDiff in the editor ApplicationDto

**Files:**
- Modify: `frontend/src/app/features/application-editor/editor.component.ts`

The backend `GET /applications/:id` already returns all Application fields (Prisma `findUnique` with no `select`, so `optimizationDiff` is automatically included). The frontend only needs the type added to `ApplicationDto` and a computed signal exposing the data.

- [ ] **Step 1: Update ApplicationDto and add computed signals**

In `frontend/src/app/features/application-editor/editor.component.ts`, update the `ApplicationDto` interface and add a typed diff interface + computed signal:

```typescript
// Add near the top of the file, before ApplicationDto:
export interface OptimizationDiffEntry {
  section: string;
  before:  string;
  after:   string;
  reason:  string;
}

// In ApplicationDto, add:
interface ApplicationDto {
  id: string;
  status?: string;
  matchScore?: number | null;
  atsScore?: number | null;
  optimizedCv?: unknown;
  coverLetter?: Record<string, string>;
  matchReport?: MatchReport;
  optimizationDiff?: OptimizationDiffEntry[] | null;   // ADD THIS LINE
  chosenVariant?: string | null;
  generationProgress?: number;
  generationError?: string | null;
  jobPosting?: { parsedJson?: { title?: string; company?: string; keywords?: string[] } };
}
```

Add a computed signal for the diff and a tab state signal, and expose `missingMustHaves` from the match report:

```typescript
// In the component class, add these signals and computeds:
readonly activeTab = signal<'lebenslauf' | 'anschreiben' | 'export' | 'email' | 'analyse'>('lebenslauf');
readonly optimizationDiff = computed(() => this.application()?.optimizationDiff ?? null);

// Already present — verify these exist:
// readonly score = computed(() => this.application()?.matchScore ?? this.application()?.atsScore ?? null);
// readonly matchReport = computed(() => this.application()?.matchReport ?? {});
// readonly keywords = computed(...);
// readonly missingKeywords = computed(...);
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/app/features/application-editor/editor.component.ts
git commit -m "Add optimizationDiff type and activeTab signal to editor component"
```

---

## Task 6: Build the AtsPanel dumb component

**Files:**
- Create: `frontend/src/app/shared/components/ats-panel/ats-panel.component.ts`
- Create: `frontend/src/app/shared/components/ats-panel/ats-panel.component.html`
- Create: `frontend/src/app/shared/components/ats-panel/ats-panel.component.scss`
- Create: `frontend/src/app/shared/components/ats-panel/ats-panel.component.spec.ts`

- [ ] **Step 1: Write failing tests**

Create `frontend/src/app/shared/components/ats-panel/ats-panel.component.spec.ts`:

```typescript
import { TestBed } from '@angular/core/testing';
import { AtsPanelComponent } from './ats-panel.component';
import type { OptimizationDiffEntry } from '../../../features/application-editor/editor.component';

const matchReport = {
  summary: 'Starker Fit',
  matchedKeywords: ['Angular', 'TypeScript'],
  missingKeywords: ['Docker', 'AWS'],
  risks: ['Docker'],
};

const diffEntries: OptimizationDiffEntry[] = [
  { section: 'Dev @ Acme', before: 'Built things', after: 'Built 5 things, improving perf by 40%', reason: 'Added metrics' },
];

describe('AtsPanelComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtsPanelComponent],
    }).compileComponents();
  });

  it('renders score ring with correct value', () => {
    const fixture = TestBed.createComponent(AtsPanelComponent);
    fixture.componentRef.setInput('score', 82);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('82');
  });

  it('renders green chips for matched keywords', () => {
    const fixture = TestBed.createComponent(AtsPanelComponent);
    fixture.componentRef.setInput('score', 82);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', null);
    fixture.detectChanges();
    const greenChips = fixture.nativeElement.querySelectorAll('.ats-panel__chip--matched');
    expect(greenChips.length).toBe(2);
  });

  it('renders red chips for must-have missing keywords (risks)', () => {
    const fixture = TestBed.createComponent(AtsPanelComponent);
    fixture.componentRef.setInput('score', 40);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', null);
    fixture.detectChanges();
    const redChips = fixture.nativeElement.querySelectorAll('.ats-panel__chip--missing-required');
    expect(redChips.length).toBe(1); // Docker is in risks
    expect(redChips[0].textContent.trim()).toBe('Docker');
  });

  it('renders orange chips for optional missing keywords', () => {
    const fixture = TestBed.createComponent(AtsPanelComponent);
    fixture.componentRef.setInput('score', 40);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', null);
    fixture.detectChanges();
    const orangeChips = fixture.nativeElement.querySelectorAll('.ats-panel__chip--missing-optional');
    expect(orangeChips.length).toBe(1); // AWS not in risks
    expect(orangeChips[0].textContent.trim()).toBe('AWS');
  });

  it('renders diff entries with before/after and reason', () => {
    const fixture = TestBed.createComponent(AtsPanelComponent);
    fixture.componentRef.setInput('score', 75);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', diffEntries);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Built things');
    expect(text).toContain('Built 5 things');
    expect(text).toContain('Added metrics');
    expect(text).toContain('Dev @ Acme');
  });

  it('shows neutral state when score is null (old application)', () => {
    const fixture = TestBed.createComponent(AtsPanelComponent);
    fixture.componentRef.setInput('score', null);
    fixture.componentRef.setInput('matchReport', null);
    fixture.componentRef.setInput('optimizationDiff', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Analyse nicht verfügbar');
  });

  it('shows empty diff section when optimizationDiff is empty array', () => {
    const fixture = TestBed.createComponent(AtsPanelComponent);
    fixture.componentRef.setInput('score', 80);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Keine Änderungen aufgezeichnet');
  });

  it('has aria-label on score region', () => {
    const fixture = TestBed.createComponent(AtsPanelComponent);
    fixture.componentRef.setInput('score', 70);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', null);
    fixture.detectChanges();
    const scoreRegion = fixture.nativeElement.querySelector('[role="status"]');
    expect(scoreRegion).toBeTruthy();
    expect(scoreRegion.getAttribute('aria-label')).toContain('70');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd frontend
npx jest ats-panel --no-coverage
```

Expected: FAIL — `Cannot find module './ats-panel.component'`

- [ ] **Step 3: Generate component scaffold**

```bash
cd frontend
ng generate component shared/components/ats-panel --standalone
```

This creates the 4 files. Now overwrite them with the actual implementation.

- [ ] **Step 4: Implement ats-panel.component.ts**

```typescript
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ScoreRingComponent } from '../score-ring.component';
import type { OptimizationDiffEntry } from '../../../features/application-editor/editor.component';

interface MatchReport {
  summary?: string;
  matchedKeywords?: string[];
  missingKeywords?: string[];
  risks?: string[];
}

@Component({
  selector: 'lba-ats-panel',
  standalone: true,
  imports: [ScoreRingComponent],
  templateUrl: './ats-panel.component.html',
  styleUrl: './ats-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AtsPanelComponent {
  score            = input.required<number | null>();
  matchReport      = input.required<MatchReport | null>();
  optimizationDiff = input.required<OptimizationDiffEntry[] | null>();

  readonly hasData = computed(() => this.score() !== null && this.score() !== undefined);

  readonly matchedKeywords = computed(() => this.matchReport()?.matchedKeywords ?? []);

  readonly missingRequired = computed(() => this.matchReport()?.risks ?? []);

  readonly missingOptional = computed(() => {
    const required = new Set(this.missingRequired());
    return (this.matchReport()?.missingKeywords ?? []).filter(k => !required.has(k));
  });

  readonly diffEntries = computed(() => this.optimizationDiff() ?? []);

  readonly scoreLabel = computed(() => {
    const s = this.score();
    if (s === null || s === undefined) return 'n/a';
    if (s >= 80) return 'Sehr gut';
    if (s >= 60) return 'Gut';
    return 'Verbesserungswürdig';
  });
}
```

- [ ] **Step 5: Implement ats-panel.component.html**

```html
<section class="ats-panel" aria-label="Analyse">

  @if (!hasData()) {
    <div class="ats-panel__empty" role="status" aria-live="polite">
      <p class="ats-panel__empty-text">
        Analyse nicht verfügbar für ältere Bewerbungen.<br>
        Erstelle eine neue Bewerbung, um den ATS-Score zu sehen.
      </p>
    </div>
  } @else {
    <!-- Score Section -->
    <div class="ats-panel__score-section">
      <div role="status" [attr.aria-label]="'ATS Score ' + score() + ' Prozent — ' + scoreLabel()" class="ats-panel__ring-wrap">
        <lba-score-ring [value]="score()!" />
        <p class="ats-panel__score-label">{{ scoreLabel() }}</p>
      </div>

      @if (matchReport()?.summary) {
        <p class="ats-panel__summary">{{ matchReport()!.summary }}</p>
      }
    </div>

    <!-- Keyword Chips -->
    <div class="ats-panel__keywords" aria-label="Schlüsselbegriffe">
      @for (kw of matchedKeywords(); track kw) {
        <span class="ats-panel__chip ats-panel__chip--matched" [attr.title]="'Gefunden: ' + kw">{{ kw }}</span>
      }
      @for (kw of missingRequired(); track kw) {
        <span class="ats-panel__chip ats-panel__chip--missing-required" [attr.title]="'Pflicht fehlt: ' + kw">{{ kw }}</span>
      }
      @for (kw of missingOptional(); track kw) {
        <span class="ats-panel__chip ats-panel__chip--missing-optional" [attr.title]="'Optional fehlt: ' + kw">{{ kw }}</span>
      }
      @if (matchedKeywords().length === 0 && missingRequired().length === 0 && missingOptional().length === 0) {
        <p class="ats-panel__no-keywords">Keine Schlüsselbegriffe verfügbar.</p>
      }
    </div>

    <!-- AI Diff Section -->
    <div class="ats-panel__diff-section">
      <h3 class="ats-panel__diff-heading">KI-Änderungen</h3>

      @if (diffEntries().length === 0) {
        <p class="ats-panel__no-diff">Keine Änderungen aufgezeichnet.</p>
      } @else {
        <ul class="ats-panel__diff-list" aria-label="Auflistung aller KI-Änderungen">
          @for (entry of diffEntries(); track entry.before) {
            <li class="ats-panel__diff-entry">
              <p class="ats-panel__diff-section-label">{{ entry.section }}</p>
              @if (entry.reason) {
                <p class="ats-panel__diff-reason">{{ entry.reason }}</p>
              }
              <div class="ats-panel__diff-blocks">
                <div class="ats-panel__diff-block ats-panel__diff-block--before" aria-label="Vorher">
                  <span class="ats-panel__diff-label">Vorher</span>
                  <p>{{ entry.before }}</p>
                </div>
                <div class="ats-panel__diff-block ats-panel__diff-block--after" aria-label="Nachher">
                  <span class="ats-panel__diff-label">Nachher</span>
                  <p>{{ entry.after }}</p>
                </div>
              </div>
            </li>
          }
        </ul>
      }
    </div>
  }

</section>
```

- [ ] **Step 6: Implement ats-panel.component.scss**

```scss
:host {
  display: block;
}

.ats-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);

  &__empty {
    padding: var(--space-8);
    text-align: center;
  }

  &__empty-text {
    color: var(--ink-2);
    line-height: 1.6;
  }

  &__score-section {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  &__ring-wrap {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  &__score-label {
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
  }

  &__summary {
    color: var(--ink-2);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  &__keywords {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  &__chip {
    display: inline-flex;
    align-items: center;
    padding: 2px var(--space-2);
    border-radius: var(--radius-full);
    font-size: 0.75rem;
    font-weight: 500;

    &--matched {
      background: color-mix(in srgb, var(--success) 15%, transparent);
      color: var(--success);
      border: 1px solid color-mix(in srgb, var(--success) 30%, transparent);
    }

    &--missing-required {
      background: color-mix(in srgb, var(--danger) 15%, transparent);
      color: var(--danger);
      border: 1px solid color-mix(in srgb, var(--danger) 30%, transparent);
    }

    &--missing-optional {
      background: color-mix(in srgb, var(--warning) 15%, transparent);
      color: var(--warning);
      border: 1px solid color-mix(in srgb, var(--warning) 30%, transparent);
    }
  }

  &__no-keywords {
    color: var(--ink-3);
    font-size: 0.875rem;
  }

  &__diff-section {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
  }

  &__diff-heading {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--ink-2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__no-diff {
    color: var(--ink-3);
    font-size: 0.875rem;
  }

  &__diff-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-6);
  }

  &__diff-entry {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  &__diff-section-label {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--ink-2);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  &__diff-reason {
    font-size: 0.8125rem;
    color: var(--accent);
    font-style: italic;
  }

  &__diff-blocks {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-3);

    @media (max-width: 600px) {
      grid-template-columns: 1fr;
    }
  }

  &__diff-block {
    padding: var(--space-3);
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    line-height: 1.5;

    p {
      margin: 0;
      color: var(--ink);
    }

    &--before {
      background: color-mix(in srgb, var(--danger) 8%, transparent);
      border-left: 3px solid var(--danger);
    }

    &--after {
      background: color-mix(in srgb, var(--success) 8%, transparent);
      border-left: 3px solid var(--success);
    }
  }

  &__diff-label {
    display: block;
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-3);
    margin-bottom: var(--space-1);
  }
}
```

- [ ] **Step 7: Run AtsPanel tests**

```bash
cd frontend
npx jest ats-panel --no-coverage
```

Expected: PASS — all 7 tests green.

- [ ] **Step 8: Commit**

```bash
git add frontend/src/app/shared/components/ats-panel/
git commit -m "Add AtsPanelComponent with score ring, keyword chips, and diff view"
```

---

## Task 7: Add "Analyse" tab to the application editor

**Files:**
- Modify: `frontend/src/app/features/application-editor/editor.component.ts`
- Modify: `frontend/src/app/features/application-editor/editor.component.html`

- [ ] **Step 1: Import AtsPanelComponent in editor.component.ts**

In `frontend/src/app/features/application-editor/editor.component.ts`, add `AtsPanelComponent` to the `imports` array in the `@Component` decorator:

```typescript
import { AtsPanelComponent } from '../../shared/components/ats-panel/ats-panel.component';

@Component({
  // ...
  imports: [ReactiveFormsModule, RouterLink, ConfirmDeleteModal, CvSectionEditorComponent, AtsPanelComponent],
  // ...
})
```

Ensure `activeTab` signal and `optimizationDiff` computed are present (added in Task 5). Verify in the class:

```typescript
readonly activeTab = signal<'lebenslauf' | 'anschreiben' | 'export' | 'email' | 'analyse'>('lebenslauf');
readonly optimizationDiff = computed(() => this.application()?.optimizationDiff ?? null);
```

- [ ] **Step 2: Add tab bar and Analyse tab to editor.component.html**

In `frontend/src/app/features/application-editor/editor.component.html`, inside the `@else { <form ...> }` block, wrap the existing content with a tabbed layout. Add the tab bar before the existing grid content:

```html
<!-- Inside the @else block, replace the existing <form class="editor__grid" ...> opening with this: -->
<form [formGroup]="editorForm">

  <!-- Tab bar -->
  <nav class="editor__tabs" role="tablist" aria-label="Bewerbungsabschnitte">
    <button
      role="tab"
      type="button"
      class="editor__tab"
      [class.editor__tab--active]="activeTab() === 'lebenslauf'"
      [attr.aria-selected]="activeTab() === 'lebenslauf'"
      aria-controls="tab-panel-lebenslauf"
      (click)="activeTab.set('lebenslauf')">
      Lebenslauf
    </button>
    <button
      role="tab"
      type="button"
      class="editor__tab"
      [class.editor__tab--active]="activeTab() === 'anschreiben'"
      [attr.aria-selected]="activeTab() === 'anschreiben'"
      aria-controls="tab-panel-anschreiben"
      (click)="activeTab.set('anschreiben')">
      Anschreiben
    </button>
    <button
      role="tab"
      type="button"
      class="editor__tab"
      [class.editor__tab--active]="activeTab() === 'analyse'"
      [attr.aria-selected]="activeTab() === 'analyse'"
      aria-controls="tab-panel-analyse"
      (click)="activeTab.set('analyse')">
      Analyse
    </button>
  </nav>

  <!-- Existing content panels wrapped in tab panels -->
  @if (activeTab() === 'lebenslauf') {
    <div id="tab-panel-lebenslauf" role="tabpanel" aria-label="Lebenslauf" class="editor__grid">
      <!-- MOVE the existing <aside class="panel panel--match"> and CV section editor here -->
      <aside class="panel panel--match" aria-labelledby="match-title">
        <!-- ... existing match report aside content ... -->
      </aside>
      <section class="panel panel--cv" aria-labelledby="cv-title">
        <!-- ... existing CV section editor content ... -->
      </section>
    </div>
  }

  @if (activeTab() === 'anschreiben') {
    <div id="tab-panel-anschreiben" role="tabpanel" aria-label="Anschreiben" class="editor__grid">
      <!-- MOVE the existing cover letter panels here -->
    </div>
  }

  @if (activeTab() === 'analyse') {
    <div id="tab-panel-analyse" role="tabpanel" aria-label="Analyse" class="editor__panel editor__panel--analyse">
      <lba-ats-panel
        [score]="currentScore()"
        [matchReport]="currentMatchReport()"
        [optimizationDiff]="optimizationDiff()" />
    </div>
  }

</form>
```

**Important:** The existing template already has a complex multi-panel layout. Rather than restructuring the entire editor HTML in one step, take this targeted approach:
1. Keep the existing `editor__grid` structure entirely intact
2. Add the "Analyse" tab button to whatever tab bar already exists in the template (or add a new minimal tab bar if none exists)
3. Conditionally show `<lba-ats-panel>` as an additional section below the existing grid when `activeTab() === 'analyse'`

Minimal, non-breaking version — add after the closing `</form>` tag of the existing grid content, still inside the `@else` block:

```html
<!-- Tab selector for Analyse — add inside the @else block, before the existing <form> -->
<nav class="editor__tab-bar" role="tablist" aria-label="Ansicht wählen">
  <button role="tab" type="button" class="editor__tab-btn"
    [class.editor__tab-btn--active]="activeTab() !== 'analyse'"
    [attr.aria-selected]="activeTab() !== 'analyse'"
    (click)="activeTab.set('lebenslauf')">
    Bewerbung
  </button>
  <button role="tab" type="button" class="editor__tab-btn"
    [class.editor__tab-btn--active]="activeTab() === 'analyse'"
    [attr.aria-selected]="activeTab() === 'analyse'"
    aria-controls="tab-panel-analyse"
    (click)="activeTab.set('analyse')">
    Analyse
  </button>
</nav>

<!-- Existing form — shown when not on analyse tab -->
@if (activeTab() !== 'analyse') {
  <form class="editor__grid" [formGroup]="editorForm">
    <!-- ALL EXISTING CONTENT UNCHANGED -->
  </form>
}

<!-- Analyse tab panel -->
@if (activeTab() === 'analyse') {
  <div id="tab-panel-analyse" role="tabpanel" tabindex="0" aria-label="Analyse" class="editor__analyse-panel">
    <lba-ats-panel
      [score]="currentScore()"
      [matchReport]="currentMatchReport()"
      [optimizationDiff]="optimizationDiff()" />
  </div>
}
```

Add to `editor.component.scss`:

```scss
.editor__tab-bar {
  display: flex;
  gap: var(--space-1);
  border-bottom: 1px solid var(--bg-2);
  margin-bottom: var(--space-4);
}

.editor__tab-btn {
  padding: var(--space-2) var(--space-4);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--ink-2);
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: color 0.15s, border-color 0.15s;

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  &--active {
    color: var(--ink);
    border-bottom-color: var(--accent);
  }
}

.editor__analyse-panel {
  max-width: 800px;
  padding: var(--space-6) 0;
}
```

- [ ] **Step 3: Run frontend lint and tests**

```bash
cd frontend
npm run lint && npm test -- --watchAll=false
```

Expected: exit 0.

- [ ] **Step 4: Run frontend build**

```bash
cd frontend
npm run build
```

Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/features/application-editor/
git commit -m "Add Analyse tab to application editor with AtsPanel"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] ATS Score panel with score ring and quality label → Task 6 (`AtsPanelComponent`, `scoreLabel` computed)
- [x] Keyword chips: green (found), red (must-have missing = risks), orange (optional) → Task 6 computed signals + template
- [x] AI change diff before/after with reason label → Task 3 (`DiffComputerService`) + Task 6 template
- [x] Neutral state for old applications (`score === null`) → Task 6 `hasData()` guard
- [x] New DB field `optimizationDiff` → Task 1
- [x] Optimizer prompt asks for `reason` → Task 2
- [x] Diff persisted in pipeline → Task 4
- [x] No new ATS scoring service — reuses `MatchScoringService` (already runs in pipeline)
- [x] Error handling: DiffComputerService failure doesn't block pipeline → Task 4 try/catch

**Placeholder scan:** None found.

**Type consistency:**
- `OptimizationDiffEntry` defined in `editor.component.ts`, imported in `ats-panel.component.ts` and `ats-panel.component.spec.ts`
- `DiffEntry` in `diff-computer.service.ts` matches `OptimizationDiffEntry` shape (section, before, after, reason: string)
- `currentScore()`, `currentMatchReport()` already exist in editor — used as inputs to `<lba-ats-panel>`
- `score = input.required<number | null>()` — `currentScore()` returns `number | null` ✓
