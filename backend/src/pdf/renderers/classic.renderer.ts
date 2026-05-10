import { PDFDocument, StandardFonts, rgb, type PDFPage } from 'pdf-lib';
import type { CvPdfData, CvRenderer } from './renderer.interface';
import { sanitizeText, wrapText } from './pdf-utils';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 50;
const LINE_HEIGHT = 14;
const INK = rgb(0.08, 0.07, 0.16);
const BODY = rgb(0.22, 0.2, 0.32);
const RULE = rgb(0.4, 0.4, 0.4);

export class ClassicRenderer implements CvRenderer {
  async render(data: CvPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page: PDFPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = 800;

    page.drawText(sanitizeText(data.name || 'Lebenslauf'), {
      x: MARGIN,
      y,
      font: boldFont,
      size: 20,
      color: INK,
    });
    y -= 34;

    for (const section of data.sections) {
      if (y < 90) {
        page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
        y = 800;
      }

      page.drawText(sanitizeText(section.heading), {
        x: MARGIN,
        y,
        font: boldFont,
        size: 12,
        color: INK,
      });
      y -= 5;

      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: PAGE_WIDTH - MARGIN, y },
        thickness: 0.5,
        color: RULE,
      });
      y -= 16;

      for (const line of section.lines.flatMap(item => wrapText(item, 90))) {
        if (y < 60) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = 800;
        }

        page.drawText(`- ${sanitizeText(line)}`, {
          x: MARGIN + 10,
          y,
          font,
          size: 10,
          color: BODY,
        });
        y -= LINE_HEIGHT;
      }

      y -= 10;
    }

    return pdfDoc.save();
  }
}
