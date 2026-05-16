import { describe, expect, it } from '@jest/globals';
import { inflateSync } from 'zlib';
import { PDFDocument } from 'pdf-lib';
import { PdfService } from './pdf.service';
import type { CvLayout, CvPdfData } from './renderers/renderer.interface';

interface TextDraw {
  text: string;
  x: number;
  y: number;
}

interface ContentArray {
  asArray(): unknown[];
}

interface LoadedPageWithContent {
  node: {
    Contents(): ContentArray | unknown;
  };
  doc: {
    context: {
      lookup(ref: unknown): unknown;
    };
  };
}

interface RawStream {
  contents: Uint8Array;
}

const sampleCv: CvPdfData = {
  name: 'Anna Mueller',
  sections: [{ heading: 'Erfahrung', lines: ['Senior Developer at Acme GmbH'] }],
};

describe('PDF layout selection', () => {
  const service = new PdfService();

  it.each([
    {
      layout: 'classic' as const,
      name: { x: 50, y: 800 },
      heading: { text: 'Erfahrung', x: 50, y: 766 },
      body: { text: '- Senior Developer at Acme GmbH', x: 60, y: 745 },
    },
    {
      layout: 'modern' as const,
      name: { x: 18, y: 810 },
      heading: { text: 'ERFAHRUNG', x: 245, y: 810 },
      body: { text: '> Senior Developer at Acme GmbH', x: 253, y: 792 },
    },
    {
      layout: 'editorial' as const,
      name: { x: 50, y: 804 },
      heading: { text: 'ERFAHRUNG', x: 50, y: 738 },
      body: { text: '- Senior Developer at Acme GmbH', x: 60, y: 722 },
    },
    {
      layout: 'minimal' as const,
      name: { x: 70, y: 782 },
      heading: { text: 'ERFAHRUNG', x: 70, y: 728 },
      body: { text: '- Senior Developer at Acme GmbH', x: 78, y: 712 },
    },
    {
      layout: 'executive' as const,
      name: { x: 60, y: 808 },
      heading: { text: 'ERFAHRUNG', x: 50, y: 738 },
      body: { text: 'o Senior Developer at Acme GmbH', x: 58, y: 718 },
    },
  ])('routes $layout selection to the expected text placement', async ({ layout, name, heading, body }) => {
    const buffer = await service.generateCvPdf(sampleCv, layout);
    const draws = extractTextDraws(await firstPageContent(buffer));

    expectDraw(draws, 'Anna Mueller', name.x, name.y);
    expectDraw(draws, heading.text, heading.x, heading.y);
    expectDraw(draws, body.text, body.x, body.y);
  });

  it('falls back unknown layout input to the modern placement contract', async () => {
    const buffer = await service.generateCvPdf(sampleCv, 'unknown' as CvLayout);
    const draws = extractTextDraws(await firstPageContent(buffer));

    expectDraw(draws, 'Anna Mueller', 18, 810);
    expectDraw(draws, 'ERFAHRUNG', 245, 810);
    expectDraw(draws, '> Senior Developer at Acme GmbH', 253, 792);
  });
});

async function firstPageContent(buffer: Buffer): Promise<string> {
  const doc = await PDFDocument.load(buffer);
  const page = doc.getPages()[0] as LoadedPageWithContent;
  const contents = page.node.Contents();
  const refs = isContentArray(contents) ? contents.asArray() : [contents];

  return refs.map(ref => {
    const stream = page.doc.context.lookup(ref);
    if (!isRawStream(stream)) return '';
    return inflateSync(Buffer.from(stream.contents)).toString('latin1');
  }).join('\n');
}

function extractTextDraws(content: string): TextDraw[] {
  const draws: TextDraw[] = [];
  const pattern = /1 0 0 1 ([\d.]+) ([\d.]+) Tm\s+<([0-9A-F]+)> Tj/g;
  let match: RegExpExecArray | null = pattern.exec(content);

  while (match) {
    draws.push({
      x: Number(match[1]),
      y: Number(match[2]),
      text: Buffer.from(match[3], 'hex').toString('latin1'),
    });
    match = pattern.exec(content);
  }

  return draws;
}

function expectDraw(draws: TextDraw[], text: string, x: number, y: number): void {
  expect(draws).toContainEqual({ text, x, y });
}

function isContentArray(value: unknown): value is ContentArray {
  return typeof value === 'object' && value !== null && typeof (value as { asArray?: unknown }).asArray === 'function';
}

function isRawStream(value: unknown): value is RawStream {
  return typeof value === 'object' && value !== null && value instanceof Object && 'contents' in value;
}
