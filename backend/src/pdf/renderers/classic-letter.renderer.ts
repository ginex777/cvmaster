import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import type { LetterPdfData, LetterRenderer } from './renderer.interface';
import { sanitizeText, wrapText } from './pdf-utils';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 60;
const LINE_HEIGHT = 16;
const INK = rgb(0.08, 0.07, 0.16);
const BODY = rgb(0.22, 0.2, 0.32);
const RULE = rgb(0.72, 0.72, 0.72);

export class ClassicLetterRenderer implements LetterRenderer {
  async render(data: LetterPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = 780;

    y = this.drawHeader(page, boldFont, data.title, y);

    for (const paragraph of data.text.split(/\n{2,}/)) {
      for (const line of wrapText(paragraph, 85)) {
        if (y < 60) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y = 780;
        }

        page.drawText(sanitizeText(line), {
          x: MARGIN,
          y,
          font,
          size: 11,
          color: BODY,
        });
        y -= LINE_HEIGHT;
      }
      y -= LINE_HEIGHT;
    }

    return pdfDoc.save();
  }

  private drawHeader(page: PDFPage, boldFont: PDFFont, title: string, y: number): number {
    page.drawText(sanitizeText(title || 'Anschreiben'), {
      x: MARGIN,
      y,
      font: boldFont,
      size: 14,
      color: INK,
    });
    page.drawLine({
      start: { x: MARGIN, y: y - 10 },
      end: { x: PAGE_WIDTH - MARGIN, y: y - 10 },
      thickness: 0.5,
      color: RULE,
    });
    return y - 34;
  }
}
