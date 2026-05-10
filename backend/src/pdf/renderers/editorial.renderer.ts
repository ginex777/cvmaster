import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import type { CvPdfData, CvRenderer } from './renderer.interface';
import { sanitizeText, wrapText } from './pdf-utils';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const HEADER_HEIGHT = 80;
const MARGIN = 50;
const LINE_HEIGHT = 14;
const DARK = rgb(0.06, 0.09, 0.18);
const WHITE = rgb(1, 1, 1);
const ACCENT = rgb(0.22, 0.35, 0.9);
const BODY = rgb(0.22, 0.26, 0.36);
const LABEL = rgb(0.58, 0.62, 0.7);
const RULE = rgb(0.88, 0.9, 0.94);

export class EditorialRenderer implements CvRenderer {
  async render(data: CvPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page: PDFPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

    page.drawRectangle({
      x: 0,
      y: PAGE_HEIGHT - HEADER_HEIGHT,
      width: PAGE_WIDTH,
      height: HEADER_HEIGHT,
      color: DARK,
    });

    page.drawText(sanitizeText(data.name || 'Lebenslauf'), {
      x: MARGIN,
      y: PAGE_HEIGHT - 38,
      font: boldFont,
      size: 18,
      color: WHITE,
    });

    if (data.sections[0]) {
      page.drawText(sanitizeText(data.sections[0].heading).toUpperCase(), {
        x: MARGIN,
        y: PAGE_HEIGHT - 58,
        font,
        size: 8,
        color: ACCENT,
      });
    }

    let y = PAGE_HEIGHT - HEADER_HEIGHT - 24;
    for (const section of data.sections) {
      if (y < 90) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = 800;
      }

      page.drawText(sanitizeText(section.heading).toUpperCase(), {
        x: MARGIN,
        y,
        font: boldFont,
        size: 8,
        color: LABEL,
      });
      page.drawLine({
        start: { x: MARGIN + 120, y: y + 4 },
        end: { x: PAGE_WIDTH - MARGIN, y: y + 4 },
        thickness: 0.5,
        color: RULE,
      });
      y -= 16;

      for (const line of section.lines.flatMap(item => wrapText(item, 88))) {
        if (y < 60) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = 800;
        }

        page.drawText(`- ${sanitizeText(line)}`, {
          x: MARGIN + 10,
          y,
          font,
          size: 9,
          color: BODY,
        });
        y -= LINE_HEIGHT;
      }

      y -= 12;
    }

    return pdfDoc.save();
  }
}
