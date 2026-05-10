import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import type { CvPdfData, CvRenderer } from './renderer.interface';
import { sanitizeText, wrapText } from './pdf-utils';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const SIDEBAR_WIDTH = 225;
const MAIN_X = 245;
const LINE_HEIGHT = 13;
const ACCENT = rgb(0.22, 0.35, 0.9);
const WHITE = rgb(1, 1, 1);
const WHITE_MUTED = rgb(0.8, 0.83, 0.95);
const BODY = rgb(0.22, 0.26, 0.36);
const RULE = rgb(0.85, 0.88, 0.96);

export class ModernRenderer implements CvRenderer {
  async render(data: CvPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page = this.addPage(pdfDoc);

    page.drawText(sanitizeText(data.name || 'Lebenslauf'), {
      x: 18,
      y: 810,
      font: boldFont,
      size: 14,
      color: WHITE,
    });

    if (data.sections[0]) {
      page.drawText(sanitizeText(data.sections[0].heading), {
        x: 18,
        y: 792,
        font,
        size: 8,
        color: WHITE_MUTED,
      });
    }

    let y = 810;
    for (const section of data.sections) {
      if (y < 90) {
        page = this.addPage(pdfDoc);
        y = 810;
      }

      page.drawText(sanitizeText(section.heading).toUpperCase(), {
        x: MAIN_X,
        y,
        font: boldFont,
        size: 9,
        color: ACCENT,
      });
      y -= 4;

      page.drawLine({
        start: { x: MAIN_X, y },
        end: { x: PAGE_WIDTH - 24, y },
        thickness: 0.4,
        color: RULE,
      });
      y -= 14;

      for (const line of section.lines.flatMap(item => wrapText(item, 58))) {
        if (y < 60) {
          page = this.addPage(pdfDoc);
          y = 810;
        }

        page.drawText(`> ${sanitizeText(line)}`, {
          x: MAIN_X + 8,
          y,
          font,
          size: 8,
          color: BODY,
        });
        y -= LINE_HEIGHT;
      }

      y -= 10;
    }

    return pdfDoc.save();
  }

  private addPage(pdfDoc: PDFDocument): PDFPage {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: SIDEBAR_WIDTH,
      height: PAGE_HEIGHT,
      color: ACCENT,
    });
    return page;
  }
}
