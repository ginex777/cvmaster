import { Injectable } from '@nestjs/common';
import archiver from 'archiver';
import { ClassicRenderer } from './renderers/classic.renderer';
import { EditorialRenderer } from './renderers/editorial.renderer';
import { ModernRenderer } from './renderers/modern.renderer';
import type { CvLayout, CvPdfData, CvRenderer } from './renderers/renderer.interface';
export type { CvLayout, CvPdfData } from './renderers/renderer.interface';

@Injectable()
export class PdfService {
  async generateCvPdf(data: CvPdfData, template: CvLayout = 'modern'): Promise<Buffer> {
    return Buffer.from(await this.getRenderer(template).render(data));
  }

  async generateLetterPdf(text: string, recipientName: string): Promise<Buffer> {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 60;
    const lineHeight = 16;
    let y = 780;

    page.drawText(this.cleanText(recipientName || 'Anschreiben'), {
      x: margin,
      y,
      font: boldFont,
      size: 14,
      color: rgb(0.08, 0.07, 0.16),
    });
    y -= 32;

    for (const paragraph of text.split(/\n{2,}/)) {
      for (const line of this.wrapText(paragraph, 85)) {
        if (y < 60) {
          page = pdfDoc.addPage([595, 842]);
          y = 780;
        }

        page.drawText(this.cleanText(line), {
          x: margin,
          y,
          font,
          size: 11,
          color: rgb(0.22, 0.2, 0.32),
        });
        y -= lineHeight;
      }
      y -= lineHeight;
    }

    return Buffer.from(await pdfDoc.save());
  }

  async generateZip(files: Array<{ filename: string; buffer: Buffer }>): Promise<Buffer> {
    const archive = archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    archive.on('data', (chunk: Buffer) => chunks.push(chunk));

    for (const file of files) {
      archive.append(file.buffer, { name: file.filename });
    }

    await archive.finalize();
    return Buffer.concat(chunks);
  }

  async render(parsedCv: Record<string, unknown>, _layout: CvLayout): Promise<Buffer> {
    return this.generateCvPdf(this.recordToPdfData(parsedCv), _layout);
  }

  async renderZip(parsedCv: Record<string, unknown>, layout: CvLayout): Promise<Buffer> {
    return this.render(parsedCv, layout);
  }

  private getRenderer(template: CvLayout): CvRenderer {
    switch (template) {
      case 'classic':
        return new ClassicRenderer();
      case 'editorial':
        return new EditorialRenderer();
      case 'modern':
      default:
        return new ModernRenderer();
    }
  }

  private recordToPdfData(parsedCv: Record<string, unknown>): CvPdfData {
    const name = typeof parsedCv['name'] === 'string' ? parsedCv['name'] : 'Lebenslauf';
    const sections = Array.isArray(parsedCv['sections'])
      ? parsedCv['sections'].filter(this.isSection)
      : [{ heading: 'Lebenslauf', lines: [JSON.stringify(parsedCv)] }];

    return { name, sections };
  }

  private wrapText(value: string, maxLength: number): string[] {
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

  private cleanText(value: string): string {
    return value
      .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '-')
      .slice(0, 1000);
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
