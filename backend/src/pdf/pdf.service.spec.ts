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
});
