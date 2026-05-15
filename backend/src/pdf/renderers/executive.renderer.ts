import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import type { CvPdfData, CvRenderer } from './renderer.interface';
import { sanitizeText, wrapText } from './pdf-utils';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const HEADER_HEIGHT = 80;
const MARGIN_X = 50;
const MARGIN_BOTTOM = 50;
const LINE_HEIGHT = 14;
const HEADER = rgb(0.06, 0.09, 0.16);
const WHITE = rgb(1, 1, 1);
const SLATE = rgb(0.58, 0.64, 0.72);
const BODY = rgb(0.28, 0.33, 0.41);
const LABEL = rgb(0.06, 0.09, 0.16);
const RULE = rgb(0.89, 0.91, 0.94);

export class ExecutiveRenderer implements CvRenderer {
  async render(data: CvPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page = this.addPage(pdfDoc);

    page.drawText(sanitizeText(data.name || 'Lebenslauf'), {
      x: 60,
      y: PAGE_HEIGHT - 34,
      font: boldFont,
      size: 20,
      color: WHITE,
    });

    if (data.sections[0]) {
      page.drawText(sanitizeText(data.sections[0].heading), {
        x: 60,
        y: PAGE_HEIGHT - 52,
        font,
        size: 9,
        color: SLATE,
      });
    }

    let y = PAGE_HEIGHT - HEADER_HEIGHT - 24;
    for (const section of data.sections) {
      if (y < MARGIN_BOTTOM + 80) {
        page = this.addPage(pdfDoc);
        y = PAGE_HEIGHT - HEADER_HEIGHT - 24;
      }

      page.drawText(sanitizeText(section.heading).toUpperCase(), {
        x: MARGIN_X,
        y,
        font: boldFont,
        size: 7,
        color: LABEL,
      });
      y -= 6;
      page.drawLine({
        start: { x: MARGIN_X, y },
        end: { x: PAGE_WIDTH - MARGIN_X, y },
        thickness: 0.5,
        color: RULE,
      });
      y -= 14;

      const isSkills = this.isSkillSection(section.heading);
      const lines = isSkills
        ? wrapText(section.lines.join('  |  '), 84)
        : section.lines.flatMap(item => wrapText(item, 84));

      for (const line of lines) {
        if (y < MARGIN_BOTTOM) {
          page = this.addPage(pdfDoc);
          y = PAGE_HEIGHT - HEADER_HEIGHT - 24;
        }

        page.drawText(`${isSkills ? '' : 'o '}${sanitizeText(line)}`, {
          x: isSkills ? MARGIN_X : MARGIN_X + 8,
          y,
          font: isSkills ? boldFont : font,
          size: 9,
          color: BODY,
        });
        y -= LINE_HEIGHT;
      }

      y -= 14;
    }

    return pdfDoc.save();
  }

  private addPage(pdfDoc: PDFDocument): PDFPage {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - HEADER_HEIGHT,
      width: PAGE_WIDTH,
      height: HEADER_HEIGHT,
      color: HEADER,
    });
    return page;
  }

  private isSkillSection(heading: string): boolean {
    const normalized = heading.toLowerCase();
    return normalized.includes('skill') || normalized.includes('kenntnis') || normalized.includes('faehigkeit');
  }
}
