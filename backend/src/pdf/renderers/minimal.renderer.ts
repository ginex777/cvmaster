import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import type { CvPdfData, CvRenderer } from './renderer.interface';
import { sanitizeText, wrapText } from './pdf-utils';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_X = 70;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 60;
const LINE_HEIGHT = 14;
const INK = rgb(0.07, 0.07, 0.07);
const BODY = rgb(0.2, 0.2, 0.2);
const MUTED = rgb(0.47, 0.47, 0.47);
const LABEL = rgb(0.6, 0.6, 0.6);
const RULE = rgb(0.9, 0.9, 0.9);

export class MinimalRenderer implements CvRenderer {
  async render(data: CvPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page: PDFPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN_TOP;

    page.drawText(sanitizeText(data.name || 'Lebenslauf'), {
      x: MARGIN_X,
      y,
      font,
      size: 18,
      color: INK,
    });
    y -= 16;

    if (data.sections[0]) {
      page.drawText(sanitizeText(data.sections[0].heading), {
        x: MARGIN_X,
        y,
        font,
        size: 10,
        color: MUTED,
      });
      y -= 12;
    }

    this.drawRule(page, y);
    y -= 26;

    for (const section of data.sections) {
      if (y < MARGIN_BOTTOM + 80) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = PAGE_HEIGHT - MARGIN_TOP;
      }

      this.drawRule(page, y + 8);
      page.drawText(sanitizeText(section.heading).toUpperCase(), {
        x: MARGIN_X,
        y,
        font: boldFont,
        size: 7,
        color: LABEL,
      });
      y -= 16;

      const lines = this.isSkillSection(section.heading)
        ? wrapText(section.lines.join(', '), 82)
        : section.lines.flatMap(item => wrapText(item, 82));

      for (const line of lines) {
        if (y < MARGIN_BOTTOM) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = PAGE_HEIGHT - MARGIN_TOP;
        }

        page.drawText(`${this.isSkillSection(section.heading) ? '' : '- '}${sanitizeText(line)}`, {
          x: this.isSkillSection(section.heading) ? MARGIN_X : MARGIN_X + 8,
          y,
          font,
          size: 9,
          color: this.isSkillSection(section.heading) ? MUTED : BODY,
        });
        y -= LINE_HEIGHT;
      }

      y -= 14;
    }

    return pdfDoc.save();
  }

  private drawRule(page: PDFPage, y: number): void {
    page.drawLine({
      start: { x: MARGIN_X, y },
      end: { x: PAGE_WIDTH - MARGIN_X, y },
      thickness: 0.5,
      color: RULE,
    });
  }

  private isSkillSection(heading: string): boolean {
    const normalized = heading.toLowerCase();
    return normalized.includes('skill') || normalized.includes('kenntnis') || normalized.includes('fähigkeit');
  }
}
