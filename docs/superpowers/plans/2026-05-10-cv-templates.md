# CV Template System Implementation Plan

> Codex completion note: all checklist items are marked complete after backend lint/tests and frontend lint/tests/build passed on 2026-05-12.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add Classic / Modern / Editorial PDF templates to MasterCvs, letting users pick a template inline in the CV library.

**Architecture:** A `template` field is added to `MasterCv` (default `"modern"`). Three renderer classes (`ClassicRenderer`, `ModernRenderer`, `EditorialRenderer`) each implement a `CvRenderer` interface. `PdfService.generateCvPdf()` dispatches to the correct renderer. The Angular CV library shows an inline 3-button picker per card that PATCHes the template on click with optimistic update.

**Tech Stack:** NestJS + Prisma (PostgreSQL), pdf-lib, Angular 21 (signals, OnPush), Jest (backend + frontend)

---

## File Map

**Create:**
- `backend/src/pdf/renderers/renderer.interface.ts` — `CvLayout` type + `CvRenderer` interface
- `backend/src/pdf/renderers/pdf-utils.ts` — shared: `sanitizeText`, `wrapText`, `addPageIfNeeded`
- `backend/src/pdf/renderers/classic.renderer.ts` — single-column serif layout
- `backend/src/pdf/renderers/classic.renderer.spec.ts`
- `backend/src/pdf/renderers/modern.renderer.ts` — two-column sidebar layout
- `backend/src/pdf/renderers/modern.renderer.spec.ts`
- `backend/src/pdf/renderers/editorial.renderer.ts` — dark header + pill tags
- `backend/src/pdf/renderers/editorial.renderer.spec.ts`
- `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.component.ts` (via CLI)
- `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.component.html` (via CLI)
- `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.component.scss` (via CLI)
- `frontend/src/app/shared/components/cv-template-picker/cv-template-picker.component.spec.ts` (via CLI)

**Modify:**
- `backend/prisma/schema.prisma` — add `template String @default("modern")` to `MasterCv`
- `backend/src/pdf/pdf.service.ts` — dispatcher, updated signature, import from renderers
- `backend/src/cvs/cvs.service.ts` — add `template` to `update()`, include in `listForUser` select, fix ownership check
- `backend/src/cvs/cvs.controller.ts` — add Zod validation for PATCH body
- `backend/src/applications/applications.controller.ts` — `downloadPdf()` reads `masterCv.template`; update `exportSchema`
- `frontend/src/app/features/master-cvs/master-cvs.component.ts` — add `template` to interface, add `updateTemplate()`
- `frontend/src/app/features/master-cvs/master-cvs.component.html` — render picker per card
- `frontend/src/app/features/master-cvs/master-cvs.component.spec.ts` — tests for `updateTemplate()`

---

## Task 1: Prisma Migration — Add `template` to MasterCv

**Files:**
- Modify: `backend/prisma/schema.prisma`

- [x] **Step 1: Add the field to schema**

Open `backend/prisma/schema.prisma`. Find the `MasterCv` model and add the `template` field after `containsArt9`:

```prisma
model MasterCv {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @db.Uuid
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  name           String
  language       String
  parsedJson     Json
  sourceFilename String
  sourceHash     String
  containsArt9   Boolean  @default(false)
  template       String   @default("modern")
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  applications   Application[]
}
```

- [x] **Step 2: Run the migration**

```bash
cd backend
npx prisma migrate dev --name add-masterCv-template
```

Expected output:
```
Applying migration `20260510_add-masterCv-template`
Your database is now in sync with your schema.
```

- [x] **Step 3: Verify Prisma client is regenerated**

```bash
npx prisma generate
```

Expected: `Generated Prisma Client` message with no errors.

- [x] **Step 4: Commit**

```bash
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "Add template field to MasterCv schema"
```

---

## Task 2: Renderer Interface + Shared PDF Utilities

**Files:**
- Create: `backend/src/pdf/renderers/renderer.interface.ts`
- Create: `backend/src/pdf/renderers/pdf-utils.ts`

- [x] **Step 1: Create the renderer interface file**

```typescript
// backend/src/pdf/renderers/renderer.interface.ts

export type CvLayout = 'classic' | 'modern' | 'editorial';

export interface CvPdfData {
  name: string;
  sections: Array<{ heading: string; lines: string[] }>;
}

export interface CvRenderer {
  render(data: CvPdfData): Promise<Uint8Array>;
}
```

- [x] **Step 2: Create the shared utilities file**

```typescript
// backend/src/pdf/renderers/pdf-utils.ts
import type { PDFDocument, PDFPage } from 'pdf-lib';

export function sanitizeText(value: string): string {
  return value
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '-')
    .slice(0, 1000);
}

export function wrapText(value: string, maxLength: number): string[] {
  const words = value.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) lines.push(current);
  return lines.length ? lines : [''];
}

export function addPageIfNeeded(
  pdfDoc: PDFDocument,
  page: PDFPage,
  y: number,
  threshold: number,
  resetY = 800,
): { page: PDFPage; y: number } {
  if (y < threshold) {
    page = pdfDoc.addPage([595, 842]);
    y = resetY;
  }
  return { page, y };
}
```

- [x] **Step 3: Commit**

```bash
git add backend/src/pdf/renderers/
git commit -m "Add CvRenderer interface and shared PDF utilities"
```

---

## Task 3: Classic Renderer

**Files:**
- Create: `backend/src/pdf/renderers/classic.renderer.ts`
- Create: `backend/src/pdf/renderers/classic.renderer.spec.ts`

- [x] **Step 1: Write the failing test**

```typescript
// backend/src/pdf/renderers/classic.renderer.spec.ts
import { ClassicRenderer } from './classic.renderer';
import type { CvPdfData } from './renderer.interface';

const minimal: CvPdfData = {
  name: 'Anna Müller',
  sections: [{ heading: 'Erfahrung', lines: ['Senior Developer bei Acme GmbH'] }],
};

const empty: CvPdfData = {
  name: 'Test',
  sections: [],
};

const long: CvPdfData = {
  name: 'Test',
  sections: Array.from({ length: 25 }, (_, i) => ({
    heading: `Section ${i}`,
    lines: Array.from({ length: 8 }, (_, j) => `Bullet point ${j} with enough text to fill a line nicely`),
  })),
};

describe('ClassicRenderer', () => {
  let renderer: ClassicRenderer;
  beforeEach(() => { renderer = new ClassicRenderer(); });

  it('returns a non-empty Uint8Array for minimal input', async () => {
    const result = await renderer.render(minimal);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('does not throw for empty sections', async () => {
    await expect(renderer.render(empty)).resolves.toBeInstanceOf(Uint8Array);
  });

  it('does not throw when content overflows to multiple pages', async () => {
    await expect(renderer.render(long)).resolves.toBeInstanceOf(Uint8Array);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest classic.renderer.spec --no-coverage
```

Expected: FAIL — `ClassicRenderer` not found.

- [x] **Step 3: Implement Classic renderer**

```typescript
// backend/src/pdf/renderers/classic.renderer.ts
import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import type { CvRenderer, CvPdfData } from './renderer.interface';
import { sanitizeText, wrapText } from './pdf-utils';

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;
const LINE_H = 14;
const INK = rgb(0.08, 0.07, 0.16);
const BODY = rgb(0.22, 0.2, 0.32);
const GRAY = rgb(0.4, 0.4, 0.4);

export class ClassicRenderer implements CvRenderer {
  async render(data: CvPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page: PDFPage = pdfDoc.addPage([PAGE_W, PAGE_H]);
    let y = 800;

    // Name header
    page.drawText(sanitizeText(data.name || 'Lebenslauf'), {
      x: MARGIN, y, font: bold, size: 20, color: INK,
    });
    y -= 34;

    for (const section of data.sections) {
      if (y < 90) { page = pdfDoc.addPage([PAGE_W, PAGE_H]); y = 800; }

      // Section heading
      page.drawText(sanitizeText(section.heading), {
        x: MARGIN, y, font: bold, size: 12, color: INK,
      });
      y -= 5;

      // Horizontal rule
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: PAGE_W - MARGIN, y },
        thickness: 0.5,
        color: GRAY,
      });
      y -= 16;

      // Lines
      for (const line of section.lines.flatMap(l => wrapText(l, 90))) {
        if (y < 60) { page = pdfDoc.addPage([PAGE_W, PAGE_H]); y = 800; }
        page.drawText(`· ${sanitizeText(line)}`, {
          x: MARGIN + 10, y, font, size: 10, color: BODY,
        });
        y -= LINE_H;
      }
      y -= 10;
    }

    return pdfDoc.save();
  }
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
cd backend && npx jest classic.renderer.spec --no-coverage
```

Expected: PASS — 3 tests.

- [x] **Step 5: Commit**

```bash
git add backend/src/pdf/renderers/classic.renderer.ts backend/src/pdf/renderers/classic.renderer.spec.ts
git commit -m "Add ClassicRenderer for single-column CV PDF"
```

---

## Task 4: Modern Renderer

**Files:**
- Create: `backend/src/pdf/renderers/modern.renderer.ts`
- Create: `backend/src/pdf/renderers/modern.renderer.spec.ts`

- [x] **Step 1: Write the failing test**

```typescript
// backend/src/pdf/renderers/modern.renderer.spec.ts
import { ModernRenderer } from './modern.renderer';
import type { CvPdfData } from './renderer.interface';

const minimal: CvPdfData = {
  name: 'Anna Müller',
  sections: [{ heading: 'Erfahrung', lines: ['Senior Developer bei Acme GmbH'] }],
};

const empty: CvPdfData = { name: 'Test', sections: [] };

const long: CvPdfData = {
  name: 'Test',
  sections: Array.from({ length: 25 }, (_, i) => ({
    heading: `Section ${i}`,
    lines: Array.from({ length: 8 }, (_, j) => `Bullet point ${j} with enough text to fill a line nicely`),
  })),
};

describe('ModernRenderer', () => {
  let renderer: ModernRenderer;
  beforeEach(() => { renderer = new ModernRenderer(); });

  it('returns a non-empty Uint8Array for minimal input', async () => {
    const result = await renderer.render(minimal);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('does not throw for empty sections', async () => {
    await expect(renderer.render(empty)).resolves.toBeInstanceOf(Uint8Array);
  });

  it('does not throw when content overflows to multiple pages', async () => {
    await expect(renderer.render(long)).resolves.toBeInstanceOf(Uint8Array);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest modern.renderer.spec --no-coverage
```

Expected: FAIL — `ModernRenderer` not found.

- [x] **Step 3: Implement Modern renderer**

```typescript
// backend/src/pdf/renderers/modern.renderer.ts
import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import type { CvRenderer, CvPdfData } from './renderer.interface';
import { sanitizeText, wrapText } from './pdf-utils';

const PAGE_W = 595;
const PAGE_H = 842;
const SIDEBAR_W = 225;
const MAIN_X = 232;
const MAIN_W = PAGE_W - MAIN_X - 10;
const LINE_H = 13;
const ACCENT = rgb(0.22, 0.35, 0.90);
const WHITE = rgb(1, 1, 1);
const WHITE_DIM = rgb(0.8, 0.83, 0.95);
const MAIN_INK = rgb(0.06, 0.09, 0.18);
const MAIN_BODY = rgb(0.22, 0.26, 0.36);
const MAIN_META = rgb(0.45, 0.50, 0.60);

export class ModernRenderer implements CvRenderer {
  async render(data: CvPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // First page
    let page = this.addPage(pdfDoc);

    // Sidebar: name + subtitle from first section heading
    let sy = 810;
    page.drawText(sanitizeText(data.name || 'Lebenslauf'), {
      x: 14, y: sy, font: bold, size: 14, color: WHITE,
    });
    sy -= 16;
    if (data.sections[0]) {
      page.drawText(sanitizeText(data.sections[0].heading), {
        x: 14, y: sy, font, size: 8, color: WHITE_DIM,
      });
      sy -= 20;
    }

    // Main content
    let y = 810;
    for (const section of data.sections) {
      if (y < 90) { page = this.addPage(pdfDoc); y = 810; }

      // Section label
      page.drawText(sanitizeText(section.heading).toUpperCase(), {
        x: MAIN_X, y, font: bold, size: 9, color: ACCENT,
      });
      y -= 4;
      page.drawLine({
        start: { x: MAIN_X, y },
        end: { x: PAGE_W - 10, y },
        thickness: 0.4,
        color: rgb(0.85, 0.88, 0.96),
      });
      y -= 14;

      for (const line of section.lines.flatMap(l => wrapText(l, 60))) {
        if (y < 60) { page = this.addPage(pdfDoc); y = 810; }
        page.drawText(`▸ ${sanitizeText(line)}`, {
          x: MAIN_X + 8, y, font, size: 8, color: MAIN_BODY,
        });
        y -= LINE_H;
      }
      y -= 10;
    }

    return pdfDoc.save();
  }

  private addPage(pdfDoc: PDFDocument): PDFPage {
    const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({
      x: 0, y: 0,
      width: SIDEBAR_W,
      height: PAGE_H,
      color: ACCENT,
    });
    return page;
  }
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
cd backend && npx jest modern.renderer.spec --no-coverage
```

Expected: PASS — 3 tests.

- [x] **Step 5: Commit**

```bash
git add backend/src/pdf/renderers/modern.renderer.ts backend/src/pdf/renderers/modern.renderer.spec.ts
git commit -m "Add ModernRenderer for two-column sidebar CV PDF"
```

---

## Task 5: Editorial Renderer

**Files:**
- Create: `backend/src/pdf/renderers/editorial.renderer.ts`
- Create: `backend/src/pdf/renderers/editorial.renderer.spec.ts`

- [x] **Step 1: Write the failing test**

```typescript
// backend/src/pdf/renderers/editorial.renderer.spec.ts
import { EditorialRenderer } from './editorial.renderer';
import type { CvPdfData } from './renderer.interface';

const minimal: CvPdfData = {
  name: 'Anna Müller',
  sections: [{ heading: 'Erfahrung', lines: ['Senior Developer bei Acme GmbH'] }],
};

const empty: CvPdfData = { name: 'Test', sections: [] };

const long: CvPdfData = {
  name: 'Test',
  sections: Array.from({ length: 25 }, (_, i) => ({
    heading: `Section ${i}`,
    lines: Array.from({ length: 8 }, (_, j) => `Bullet point ${j} with enough text to fill a line nicely`),
  })),
};

describe('EditorialRenderer', () => {
  let renderer: EditorialRenderer;
  beforeEach(() => { renderer = new EditorialRenderer(); });

  it('returns a non-empty Uint8Array for minimal input', async () => {
    const result = await renderer.render(minimal);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('does not throw for empty sections', async () => {
    await expect(renderer.render(empty)).resolves.toBeInstanceOf(Uint8Array);
  });

  it('does not throw when content overflows to multiple pages', async () => {
    await expect(renderer.render(long)).resolves.toBeInstanceOf(Uint8Array);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest editorial.renderer.spec --no-coverage
```

Expected: FAIL — `EditorialRenderer` not found.

- [x] **Step 3: Implement Editorial renderer**

```typescript
// backend/src/pdf/renderers/editorial.renderer.ts
import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import type { CvRenderer, CvPdfData } from './renderer.interface';
import { sanitizeText, wrapText } from './pdf-utils';

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 50;
const LINE_H = 14;
const HEADER_H = 80;
const DARK = rgb(0.06, 0.09, 0.18);
const WHITE = rgb(1, 1, 1);
const WHITE_DIM = rgb(0.75, 0.78, 0.88);
const ACCENT = rgb(0.22, 0.35, 0.90);
const INK = rgb(0.08, 0.09, 0.16);
const BODY = rgb(0.22, 0.26, 0.36);
const RULE = rgb(0.88, 0.90, 0.94);
const LABEL = rgb(0.58, 0.62, 0.70);

export class EditorialRenderer implements CvRenderer {
  async render(data: CvPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let page: PDFPage = pdfDoc.addPage([PAGE_W, PAGE_H]);

    // Dark header block
    page.drawRectangle({ x: 0, y: PAGE_H - HEADER_H, width: PAGE_W, height: HEADER_H, color: DARK });

    // Name in header
    page.drawText(sanitizeText(data.name || 'Lebenslauf'), {
      x: MARGIN, y: PAGE_H - 38, font: bold, size: 18, color: WHITE,
    });

    // Role (first section heading) in header
    if (data.sections[0]) {
      page.drawText(sanitizeText(data.sections[0].heading.toUpperCase()), {
        x: MARGIN, y: PAGE_H - 58, font, size: 8, color: ACCENT,
      });
    }

    let y = PAGE_H - HEADER_H - 24;

    for (const section of data.sections) {
      if (y < 90) { page = pdfDoc.addPage([PAGE_W, PAGE_H]); y = 800; }

      // Section title with rule
      page.drawText(sanitizeText(section.heading).toUpperCase(), {
        x: MARGIN, y, font: bold, size: 8, color: LABEL,
      });
      page.drawLine({
        start: { x: MARGIN + 120, y: y + 4 },
        end: { x: PAGE_W - MARGIN, y: y + 4 },
        thickness: 0.5,
        color: RULE,
      });
      y -= 16;

      for (const line of section.lines.flatMap(l => wrapText(l, 88))) {
        if (y < 60) { page = pdfDoc.addPage([PAGE_W, PAGE_H]); y = 800; }
        page.drawText(`— ${sanitizeText(line)}`, {
          x: MARGIN + 10, y, font, size: 9, color: BODY,
        });
        y -= LINE_H;
      }
      y -= 12;
    }

    return pdfDoc.save();
  }
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
cd backend && npx jest editorial.renderer.spec --no-coverage
```

Expected: PASS — 3 tests.

- [x] **Step 5: Commit**

```bash
git add backend/src/pdf/renderers/editorial.renderer.ts backend/src/pdf/renderers/editorial.renderer.spec.ts
git commit -m "Add EditorialRenderer for dark-header CV PDF"
```

---

## Task 6: Update PdfService — Dispatcher

**Files:**
- Modify: `backend/src/pdf/pdf.service.ts`
- Create: `backend/src/pdf/pdf.service.spec.ts`

- [x] **Step 1: Write failing dispatcher tests**

```typescript
// backend/src/pdf/pdf.service.spec.ts
import { PdfService } from './pdf.service';

const minimalData = {
  name: 'Test',
  sections: [{ heading: 'Erfahrung', lines: ['Senior Dev'] }],
};

describe('PdfService', () => {
  let service: PdfService;
  beforeEach(() => { service = new PdfService(); });

  it('generates a PDF buffer for classic layout', async () => {
    const buf = await service.generateCvPdf(minimalData, 'classic');
    expect(buf.length).toBeGreaterThan(100);
  });

  it('generates a PDF buffer for modern layout', async () => {
    const buf = await service.generateCvPdf(minimalData, 'modern');
    expect(buf.length).toBeGreaterThan(100);
  });

  it('generates a PDF buffer for editorial layout', async () => {
    const buf = await service.generateCvPdf(minimalData, 'editorial');
    expect(buf.length).toBeGreaterThan(100);
  });

  it('falls back to modern for unknown layout', async () => {
    const buf = await service.generateCvPdf(minimalData, 'unknown' as never);
    expect(buf.length).toBeGreaterThan(100);
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest pdf.service.spec --no-coverage
```

Expected: FAIL — `generateCvPdf` does not accept a second argument yet / layout not dispatched.

- [x] **Step 3: Rewrite `pdf.service.ts`**

Replace the entire file content:

```typescript
// backend/src/pdf/pdf.service.ts
import { Injectable } from '@nestjs/common';
import type { CvLayout, CvRenderer } from './renderers/renderer.interface';
import { ClassicRenderer } from './renderers/classic.renderer';
import { ModernRenderer } from './renderers/modern.renderer';
import { EditorialRenderer } from './renderers/editorial.renderer';

export type { CvLayout };

export interface CvPdfData {
  name: string;
  sections: Array<{ heading: string; lines: string[] }>;
}

@Injectable()
export class PdfService {
  async generateCvPdf(data: CvPdfData, template: CvLayout = 'modern'): Promise<Buffer> {
    const renderer = this.getRenderer(template);
    return Buffer.from(await renderer.render(data));
  }

  async render(parsedCv: Record<string, unknown>, layout: CvLayout = 'modern'): Promise<Buffer> {
    return this.generateCvPdf(this.recordToPdfData(parsedCv), layout);
  }

  async renderZip(parsedCv: Record<string, unknown>, layout: CvLayout = 'modern'): Promise<Buffer> {
    return this.render(parsedCv, layout);
  }

  private getRenderer(template: CvLayout): CvRenderer {
    switch (template) {
      case 'classic':   return new ClassicRenderer();
      case 'editorial': return new EditorialRenderer();
      default:          return new ModernRenderer();
    }
  }

  private recordToPdfData(parsedCv: Record<string, unknown>): CvPdfData {
    const name = typeof parsedCv['name'] === 'string' ? parsedCv['name'] : 'Lebenslauf';
    const sections = Array.isArray(parsedCv['sections'])
      ? parsedCv['sections'].filter(this.isSection)
      : [{ heading: 'Lebenslauf', lines: [JSON.stringify(parsedCv)] }];
    return { name, sections };
  }

  private isSection(value: unknown): value is { heading: string; lines: string[] } {
    return (
      typeof value === 'object' &&
      value !== null &&
      typeof (value as { heading?: unknown }).heading === 'string' &&
      Array.isArray((value as { lines?: unknown }).lines)
    );
  }
}
```

- [x] **Step 4: Run test to verify it passes**

```bash
cd backend && npx jest pdf.service.spec --no-coverage
```

Expected: PASS — 4 tests.

- [x] **Step 5: Commit**

```bash
git add backend/src/pdf/pdf.service.ts backend/src/pdf/pdf.service.spec.ts
git commit -m "Refactor PdfService to dispatch to renderer classes"
```

---

## Task 7: CvsService + Controller — Template Support

**Files:**
- Modify: `backend/src/cvs/cvs.service.ts`
- Modify: `backend/src/cvs/cvs.controller.ts`
- Create: `backend/src/cvs/cvs.service.spec.ts`

- [x] **Step 1: Write failing tests**

```typescript
// backend/src/cvs/cvs.service.spec.ts
import { CvsService } from './cvs.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';

const mockPrisma = {
  masterCv: {
    findFirst: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
  },
};
const mockAi = { parseCv: jest.fn() };

describe('CvsService', () => {
  let service: CvsService;
  beforeEach(() => {
    jest.clearAllMocks();
    service = new CvsService(mockPrisma as never, mockAi as never);
  });

  describe('update', () => {
    it('throws ForbiddenException when CV does not belong to user', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue(null);
      await expect(service.update('cv-1', 'user-1', { name: 'New Name' }))
        .rejects.toThrow(ForbiddenException);
    });

    it('persists template when provided', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv-1', userId: 'user-1' });
      mockPrisma.masterCv.update.mockResolvedValue({ id: 'cv-1', template: 'editorial' });
      await service.update('cv-1', 'user-1', { template: 'editorial' });
      expect(mockPrisma.masterCv.update).toHaveBeenCalledWith({
        where: { id: 'cv-1' },
        data: { template: 'editorial' },
      });
    });

    it('throws BadRequestException for invalid template value', async () => {
      mockPrisma.masterCv.findFirst.mockResolvedValue({ id: 'cv-1', userId: 'user-1' });
      await expect(service.update('cv-1', 'user-1', { template: 'invalid' as never }))
        .rejects.toThrow(BadRequestException);
    });
  });

  describe('listForUser', () => {
    it('includes template in the select', async () => {
      mockPrisma.masterCv.findMany.mockResolvedValue([]);
      await service.listForUser('user-1');
      expect(mockPrisma.masterCv.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          select: expect.objectContaining({ template: true }),
        }),
      );
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
cd backend && npx jest cvs.service.spec --no-coverage
```

Expected: FAIL — multiple failures.

- [x] **Step 3: Rewrite `cvs.service.ts`**

```typescript
// backend/src/cvs/cvs.service.ts
import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { createHash } from 'crypto';
import { z } from 'zod';
import pdfParse from 'pdf-parse';
import * as mammoth from 'mammoth';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

const ALLOWED_MAGIC: Record<string, Buffer> = {
  pdf:  Buffer.from([0x25, 0x50, 0x44, 0x46]),
  docx: Buffer.from([0x50, 0x4b, 0x03, 0x04]),
};

const VALID_TEMPLATES = ['classic', 'modern', 'editorial'] as const;

const updateCvSchema = z.object({
  name:     z.string().min(1).max(100).optional(),
  language: z.string().optional(),
  template: z.enum(VALID_TEMPLATES).optional(),
});

@Injectable()
export class CvsService {
  constructor(private prisma: PrismaService, private ai: AiService) {}

  async parseAndStore(file: Express.Multer.File, name: string, userId: string) {
    this.validateMagicBytes(file.buffer);
    const sourceHash = createHash('sha256').update(file.buffer).digest('hex');

    const existing = await this.prisma.masterCv.findFirst({ where: { userId, sourceHash } });
    if (existing) return existing;

    const text = await this.extractText(file);
    const parsedJson = await this.ai.parseCv(text);

    return this.prisma.masterCv.create({
      data: { userId, name: name || file.originalname, language: 'de', parsedJson, sourceFilename: file.originalname, sourceHash },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.masterCv.findMany({
      where: { userId },
      select: { id: true, name: true, language: true, sourceFilename: true, template: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async update(id: string, userId: string, data: unknown) {
    const parsed = updateCvSchema.safeParse(data);
    if (!parsed.success) throw new BadRequestException(parsed.error.message);

    const cv = await this.prisma.masterCv.findFirst({ where: { id, userId } });
    if (!cv) throw new ForbiddenException('CV nicht gefunden oder kein Zugriff');

    return this.prisma.masterCv.update({ where: { id }, data: parsed.data });
  }

  async remove(id: string, userId: string) {
    const cv = await this.prisma.masterCv.findFirst({ where: { id, userId } });
    if (!cv) throw new NotFoundException('CV nicht gefunden');
    await this.prisma.masterCv.delete({ where: { id } });
  }

  private validateMagicBytes(buf: Buffer) {
    const isPdf  = buf.subarray(0, 4).equals(ALLOWED_MAGIC.pdf);
    const isDocx = buf.subarray(0, 4).equals(ALLOWED_MAGIC.docx);
    if (!isPdf && !isDocx) throw new BadRequestException('Unsupported file type');
  }

  private async extractText(file: Express.Multer.File): Promise<string> {
    const isPdf = file.buffer.subarray(0, 4).equals(ALLOWED_MAGIC.pdf);
    if (isPdf) {
      const result = await pdfParse(file.buffer);
      return result.text.slice(0, 50_000);
    }
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value.slice(0, 50_000);
  }
}
```

- [x] **Step 4: Update `cvs.controller.ts` — pass body as `unknown` to service (Zod lives in service now)**

The controller's `update` method already passes `body` to `cvs.update()` — since `CvsService.update()` now accepts `unknown` and validates with Zod internally, the controller needs no change to the Zod import. But update the type annotation:

```typescript
// backend/src/cvs/cvs.controller.ts — replace the update method only
@Patch(':id')
update(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Body() body: unknown) {
  return this.cvs.update(id, req.user.sub, body);
}
```

(Remove the cast `body as { name?: string; language?: string }` — the service now validates.)

- [x] **Step 5: Run tests to verify they pass**

```bash
cd backend && npx jest cvs.service.spec --no-coverage
```

Expected: PASS — 4 tests.

- [x] **Step 6: Commit**

```bash
git add backend/src/cvs/cvs.service.ts backend/src/cvs/cvs.controller.ts backend/src/cvs/cvs.service.spec.ts
git commit -m "Add template support to CvsService with Zod validation and ownership check"
```

---

## Task 8: Applications Controller — Read Template for PDF Download

**Files:**
- Modify: `backend/src/applications/applications.controller.ts`

- [x] **Step 1: Update `downloadPdf` to load `masterCv.template`**

In `applications.controller.ts`, the `downloadPdf` method currently calls:
```typescript
const app = await this.apps.findOne(id, req.user.sub);
const buffer = await this.pdf.generateCvPdf(this.toPdfData(app.optimizedCv, title));
```

Replace with:

```typescript
@Get(':id/pdf')
async downloadPdf(@Param('id') id: string, @Req() req: AuthenticatedRequest, @Res() res: Response) {
  const app = await this.apps.findOne(id, req.user.sub);
  const title = this.fileTitle(app);
  const template = ((app as { masterCv?: { template?: string } }).masterCv?.template ?? 'modern') as CvLayout;
  const buffer = await this.pdf.generateCvPdf(this.toPdfData(app.optimizedCv, title), template);

  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${this.safeFilename(title)}.pdf"`,
    'Content-Length': buffer.length.toString(),
  });
  res.send(buffer);
}
```

- [x] **Step 2: Add `CvLayout` to the import from `pdf.service`**

At the top of `applications.controller.ts`, change:
```typescript
import { CvPdfData, PdfService } from '../pdf/pdf.service';
```
to:
```typescript
import { CvLayout, CvPdfData, PdfService } from '../pdf/pdf.service';
```

- [x] **Step 3: Update `exportSchema` — rename `'clean'` to `'classic'`**

Find:
```typescript
const exportSchema = z.object({
  layout: z.enum(['modern', 'clean', 'editorial']),
});
```

Replace with:
```typescript
const exportSchema = z.object({
  layout: z.enum(['classic', 'modern', 'editorial']),
});
```

- [x] **Step 4: Update `findOne` to include masterCv template**

Open `backend/src/applications/applications.service.ts`. Find `findOne` and ensure `masterCv` with `template` is included in the Prisma query. If `masterCv` is not currently included, add:

```typescript
async findOne(id: string, userId: string) {
  const app = await this.prisma.application.findFirst({
    where: { id, userId },
    include: {
      masterCv: { select: { template: true } },
      jobPosting: true,
    },
  });
  if (!app) throw new NotFoundException('Bewerbung nicht gefunden');
  return app;
}
```

(If `findOne` already includes `jobPosting`, add `masterCv: { select: { template: true } }` alongside it.)

- [x] **Step 5: Run backend lint**

```bash
cd backend && npm run lint
```

Expected: exit 0, no errors.

- [x] **Step 6: Run backend tests**

```bash
cd backend && npm test -- --passWithNoTests
```

Expected: exit 0, all tests pass.

- [x] **Step 7: Commit**

```bash
git add backend/src/applications/applications.controller.ts backend/src/applications/applications.service.ts
git commit -m "Pass MasterCv template to PDF renderer in download and export routes"
```

---

## Task 9: CvTemplatePickerComponent (Angular)

**Files:**
- Create: `frontend/src/app/shared/components/cv-template-picker/` (4 files via CLI)

- [x] **Step 1: Generate component via CLI**

```bash
cd frontend
ng generate component shared/components/cv-template-picker --standalone
```

Expected output: 4 files created — `.ts`, `.html`, `.scss`, `.spec.ts`.

- [x] **Step 2: Write failing tests first**

Replace the generated `cv-template-picker.component.spec.ts`:

```typescript
// frontend/src/app/shared/components/cv-template-picker/cv-template-picker.component.spec.ts
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CvTemplatePickerComponent } from './cv-template-picker.component';

describe('CvTemplatePickerComponent', () => {
  let fixture: ComponentFixture<CvTemplatePickerComponent>;

  function create(template: 'classic' | 'modern' | 'editorial') {
    fixture = TestBed.createComponent(CvTemplatePickerComponent);
    fixture.componentRef.setInput('template', template);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvTemplatePickerComponent],
    }).compileComponents();
  });

  it('renders 3 buttons', () => {
    create('modern');
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons.length).toBe(3);
  });

  it('marks the active button with aria-pressed true', () => {
    create('editorial');
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const active = Array.from(buttons).find(b => b.getAttribute('aria-pressed') === 'true');
    expect(active?.textContent?.trim()).toBe('Creative');
  });

  it('emits templateChange when a non-active button is clicked', () => {
    create('modern');
    const emitted: string[] = [];
    fixture.componentInstance.templateChange.subscribe((v: string) => emitted.push(v));
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const classicBtn = Array.from(buttons).find(b => b.textContent?.trim() === 'Classic');
    classicBtn?.click();
    expect(emitted).toEqual(['classic']);
  });
});
```

- [x] **Step 3: Run test to verify it fails**

```bash
cd frontend && npx jest cv-template-picker --no-coverage --watchAll=false
```

Expected: FAIL.

- [x] **Step 4: Implement the component TS**

```typescript
// frontend/src/app/shared/components/cv-template-picker/cv-template-picker.component.ts
import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';

export type CvTemplate = 'classic' | 'modern' | 'editorial';

@Component({
  selector: 'lba-cv-template-picker',
  standalone: true,
  templateUrl: './cv-template-picker.component.html',
  styleUrl: './cv-template-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvTemplatePickerComponent {
  readonly template = input.required<CvTemplate>();
  readonly templateChange = output<CvTemplate>();

  readonly options: Array<{ value: CvTemplate; label: string }> = [
    { value: 'classic',   label: 'Classic'   },
    { value: 'modern',    label: 'Modern'    },
    { value: 'editorial', label: 'Creative'  },
  ];
}
```

- [x] **Step 5: Implement the template HTML**

```html
<!-- frontend/src/app/shared/components/cv-template-picker/cv-template-picker.component.html -->
<div class="picker" role="group" aria-label="CV-Template auswählen">
  @for (opt of options; track opt.value) {
    <button
      type="button"
      class="picker__btn"
      [class.picker__btn--active]="template() === opt.value"
      [attr.aria-pressed]="template() === opt.value"
      [attr.aria-label]="'Template: ' + opt.label"
      (click)="templateChange.emit(opt.value)"
    >{{ opt.label }}</button>
  }
</div>
```

- [x] **Step 6: Implement the styles**

```scss
// frontend/src/app/shared/components/cv-template-picker/cv-template-picker.component.scss
:host {
  display: block;
}

.picker {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
}

.picker__btn {
  min-height: 44px;
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--ink-2);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s, color 0.15s;

  &:hover {
    border-color: var(--accent-border);
    background: var(--accent-tint);
    color: var(--ink);
  }

  &:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 2px;
  }

  &--active {
    border-color: var(--accent);
    background: color-mix(in oklch, var(--accent), transparent 90%);
    color: var(--accent);
    font-weight: 600;
  }
}
```

- [x] **Step 7: Run tests to verify they pass**

```bash
cd frontend && npx jest cv-template-picker --no-coverage --watchAll=false
```

Expected: PASS — 3 tests.

- [x] **Step 8: Commit**

```bash
git add frontend/src/app/shared/components/cv-template-picker/
git commit -m "Add CvTemplatePickerComponent with 3-option inline template selector"
```

---

## Task 10: Update MasterCvsComponent

**Files:**
- Modify: `frontend/src/app/features/master-cvs/master-cvs.component.ts`
- Modify: `frontend/src/app/features/master-cvs/master-cvs.component.html`
- Modify: `frontend/src/app/features/master-cvs/master-cvs.component.spec.ts`

- [x] **Step 1: Write failing tests**

```typescript
// frontend/src/app/features/master-cvs/master-cvs.component.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MasterCvsComponent } from './master-cvs.component';
import { ApiService } from '../../core/api/api.service';

const mockApi = {
  get: jest.fn(),
  upload: jest.fn(),
  delete: jest.fn(),
  patch: jest.fn(),
};

describe('MasterCvsComponent', () => {
  let component: MasterCvsComponent;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockApi.get.mockResolvedValue([]);
    await TestBed.configureTestingModule({
      imports: [MasterCvsComponent],
      providers: [{ provide: ApiService, useValue: mockApi }],
    }).compileComponents();
    const fixture = TestBed.createComponent(MasterCvsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  describe('updateTemplate', () => {
    it('optimistically updates the cvs signal before API call', async () => {
      component.cvs.set([{ id: 'cv-1', name: 'My CV', language: 'de', sourceFilename: 'cv.pdf', template: 'modern', createdAt: '', updatedAt: '' }]);
      mockApi.patch.mockResolvedValue({});
      const promise = component.updateTemplate('cv-1', 'classic');
      // Optimistic update happens synchronously before await
      expect(component.cvs()[0].template).toBe('classic');
      await promise;
    });

    it('rolls back and sets error when API throws', async () => {
      component.cvs.set([{ id: 'cv-1', name: 'My CV', language: 'de', sourceFilename: 'cv.pdf', template: 'modern', createdAt: '', updatedAt: '' }]);
      mockApi.patch.mockRejectedValue(new HttpErrorResponse({ status: 500 }));
      await component.updateTemplate('cv-1', 'classic');
      expect(component.cvs()[0].template).toBe('modern');
      expect(component.error()).not.toBeNull();
    });
  });
});
```

- [x] **Step 2: Run test to verify it fails**

```bash
cd frontend && npx jest master-cvs.component.spec --no-coverage --watchAll=false
```

Expected: FAIL — `updateTemplate` does not exist.

- [x] **Step 3: Update the component TS**

Replace the entire `master-cvs.component.ts`:

```typescript
// frontend/src/app/features/master-cvs/master-cvs.component.ts
import type { OnInit } from '@angular/core';
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { CvTemplatePickerComponent, type CvTemplate } from '../../shared/components/cv-template-picker/cv-template-picker.component';

export interface MasterCv {
  id: string;
  name: string;
  language: string;
  sourceFilename: string;
  template: CvTemplate;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'lba-master-cvs',
  standalone: true,
  imports: [DatePipe, CvTemplatePickerComponent],
  templateUrl: './master-cvs.component.html',
  styleUrl: './master-cvs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterCvsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly cvs = signal<MasterCv[]>([]);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.cvs.set(await this.api.get<MasterCv[]>('/cvs'));
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Lebensläufe konnten nicht geladen werden.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async upload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('name', file.name.replace(/\.[^.]+$/, ''));
      const cv = await this.api.upload<MasterCv>('/cvs', form);
      this.cvs.update((list) => [cv, ...list]);
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Upload fehlgeschlagen.',
      );
    } finally {
      this.uploading.set(false);
      (event.target as HTMLInputElement).value = '';
    }
  }

  async updateTemplate(id: string, template: CvTemplate): Promise<void> {
    const prev = this.cvs().find(c => c.id === id)?.template ?? 'modern';
    this.cvs.update(list => list.map(c => c.id === id ? { ...c, template } : c));
    try {
      await this.api.patch(`/cvs/${id}`, { template });
    } catch {
      this.cvs.update(list => list.map(c => c.id === id ? { ...c, template: prev } : c));
      this.error.set('Template konnte nicht gespeichert werden.');
    }
  }

  async remove(id: string): Promise<void> {
    this.error.set(null);
    try {
      await this.api.delete<void>(`/cvs/${id}`);
      this.cvs.update((list) => list.filter((cv) => cv.id !== id));
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Löschen fehlgeschlagen.',
      );
    }
  }
}
```

- [x] **Step 4: Update the HTML template — add picker to each CV card**

Replace the list section (the `@for` block) in `master-cvs.component.html`. The full template becomes:

```html
<!-- frontend/src/app/features/master-cvs/master-cvs.component.html -->
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
            <strong class="cv-card__name">{{ cv.name }}</strong>
            <span class="cv-card__meta">{{ cv.sourceFilename }} · {{ cv.language.toUpperCase() }}</span>
            <time class="cv-card__date" [attr.datetime]="cv.updatedAt">
              Aktualisiert {{ cv.updatedAt | date:'dd.MM.yyyy' }}
            </time>
            <lba-cv-template-picker
              [template]="cv.template ?? 'modern'"
              (templateChange)="updateTemplate(cv.id, $event)"
              aria-label="Template für diesen Lebenslauf wählen"
            />
          </div>
          <button
            type="button"
            class="btn btn--ghost btn--sm"
            [attr.aria-label]="'Lebenslauf ' + cv.name + ' löschen'"
            (click)="remove(cv.id)">
            Löschen
          </button>
        </li>
      }
    </ul>
  }
</main>
```

- [x] **Step 5: Check `ApiService` has a `patch` method**

```bash
cd frontend && grep -r "patch" src/app/core/api/api.service.ts
```

If `patch` is missing, add it to `ApiService`:

```typescript
patch<T>(path: string, body: unknown): Promise<T> {
  return firstValueFrom(this.http.patch<T>(`${this.base}${path}`, body));
}
```

- [x] **Step 6: Run frontend tests**

```bash
cd frontend && npx jest master-cvs.component.spec --no-coverage --watchAll=false
```

Expected: PASS — 2 tests in `updateTemplate`.

- [x] **Step 7: Commit**

```bash
git add frontend/src/app/features/master-cvs/
git commit -m "Add inline template picker to CV library"
```

---

## Task 11: Full Verification

- [x] **Step 1: Backend lint**

```bash
cd backend && npm run lint
```

Expected: exit 0.

- [x] **Step 2: Backend tests**

```bash
cd backend && npm test -- --passWithNoTests
```

Expected: exit 0, all suites pass.

- [x] **Step 3: Frontend lint**

```bash
cd frontend && npm run lint
```

Expected: exit 0.

- [x] **Step 4: Frontend tests**

```bash
cd frontend && npm test -- --watchAll=false --passWithNoTests
```

Expected: exit 0, all suites pass.

- [x] **Step 5: Frontend build**

```bash
cd frontend && npm run build
```

Expected: exit 0, `dist/` produced.

- [x] **Step 6: Final commit**

```bash
git add -A
git commit -m "CV template system complete — Classic, Modern, Editorial renderers with inline picker"
```
