import { PDFDocument, StandardFonts, rgb, type PDFDocument as PdfDocument, type PDFPage } from 'pdf-lib';
import type { LetterPdfData, LetterRenderer } from './renderer.interface';
import { sanitizeText, wrapText } from './pdf-utils';

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const SIDEBAR_WIDTH = 72;
const MARGIN = 108;
const LINE_HEIGHT = 15;
const ACCENT = rgb(0.22, 0.35, 0.9);
const WHITE = rgb(1, 1, 1);
const BODY = rgb(0.22, 0.26, 0.36);

export class ModernLetterRenderer implements LetterRenderer {
  async render(data: LetterPdfData): Promise<Uint8Array> {
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    let page = this.addPage(pdfDoc);
    let y = 780;

    page.drawText(sanitizeText(data.title || 'Anschreiben'), {
      x: MARGIN,
      y,
      font: boldFont,
      size: 18,
      color: ACCENT,
    });
    y -= 42;

    for (const paragraph of data.text.split(/\n{2,}/)) {
      for (const line of wrapText(paragraph, 76)) {
        if (y < 60) {
          page = this.addPage(pdfDoc);
          y = 780;
        }

        page.drawText(sanitizeText(line), {
          x: MARGIN,
          y,
          font,
          size: 10.5,
          color: BODY,
        });
        y -= LINE_HEIGHT;
      }
      y -= LINE_HEIGHT;
    }

    return pdfDoc.save();
  }

  private addPage(pdfDoc: PdfDocument): PDFPage {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawRectangle({
      x: 0,
      y: 0,
      width: SIDEBAR_WIDTH,
      height: PAGE_HEIGHT,
      color: ACCENT,
    });
    page.drawText('LETTER', {
      x: 18,
      y: 782,
      size: 8,
      color: WHITE,
    });
    return page;
  }
}
