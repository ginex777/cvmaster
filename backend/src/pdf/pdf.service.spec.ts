import { describe, it, expect, beforeEach } from '@jest/globals';
import { PdfService } from './pdf.service';

describe('PdfService', () => {
  let service: PdfService;

  beforeEach(() => {
    service = new PdfService();
  });

  it('generateCvPdf returns Buffer starting with %PDF-', async () => {
    const buf = await service.generateCvPdf({
      name: 'Lina Hartmann',
      sections: [{ heading: 'Erfahrung', lines: ['Stripe - 2 Jahre'] }],
    });

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('generateLetterPdf returns Buffer starting with %PDF-', async () => {
    const buf = await service.generateLetterPdf('Sehr geehrte Damen und Herren,\n\nhiermit bewerbe ich mich.', 'Acme GmbH');

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('generateZip returns a ZIP buffer', async () => {
    const buf = await service.generateZip([{ filename: 'test.txt', buffer: Buffer.from('hello') }]);

    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.subarray(0, 2).toString('ascii')).toBe('PK');
  });
});
