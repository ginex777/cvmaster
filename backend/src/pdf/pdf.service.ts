import { Injectable } from '@nestjs/common';

export type CvLayout = 'modern' | 'clean' | 'editorial';

export interface CvPdfData {
  name: string;
  sections: Array<{ heading: string; lines: string[] }>;
}

@Injectable()
export class PdfService {
  async generateCvPdf(data: CvPdfData): Promise<Buffer> {
    const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();
    let page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const margin = 50;
    const lineHeight = 14;
    let y = 800;

    page.drawText(this.cleanText(data.name || 'Lebenslauf'), {
      x: margin,
      y,
      font: boldFont,
      size: 20,
      color: rgb(0.08, 0.07, 0.16),
    });
    y -= 34;

    for (const section of data.sections) {
      if (y < 90) {
        page = pdfDoc.addPage([595, 842]);
        y = 800;
      }

      page.drawText(this.cleanText(section.heading), {
        x: margin,
        y,
        font: boldFont,
        size: 12,
        color: rgb(0.08, 0.07, 0.16),
      });
      y -= 20;

      for (const line of section.lines.flatMap(item => this.wrapText(item, 92))) {
        if (y < 60) {
          page = pdfDoc.addPage([595, 842]);
          y = 800;
        }

        page.drawText(this.cleanText(line), {
          x: margin,
          y,
          font,
          size: 10,
          color: rgb(0.22, 0.2, 0.32),
        });
        y -= lineHeight;
      }

      y -= 10;
    }

    return Buffer.from(await pdfDoc.save());
  }

  async render(parsedCv: Record<string, unknown>, _layout: CvLayout): Promise<Buffer> {
    return this.generateCvPdf(this.recordToPdfData(parsedCv));
  }

  async renderZip(parsedCv: Record<string, unknown>, layout: CvLayout): Promise<Buffer> {
    return this.render(parsedCv, layout);
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
