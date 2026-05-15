import { describe, expect, it, beforeEach } from '@jest/globals';
import { ExecutiveRenderer } from './executive.renderer';
import type { CvPdfData } from './renderer.interface';

const minimal: CvPdfData = {
  name: 'Anna Mueller',
  sections: [{ heading: 'Erfahrung', lines: ['Senior Developer bei Acme GmbH'] }],
};

const long: CvPdfData = {
  name: 'Test',
  sections: Array.from({ length: 25 }, (_, i) => ({
    heading: `Section ${i}`,
    lines: Array.from({ length: 8 }, (_, j) => `Bullet point ${j} with enough text to fill a line nicely`),
  })),
};

describe('ExecutiveRenderer', () => {
  let renderer: ExecutiveRenderer;

  beforeEach(() => {
    renderer = new ExecutiveRenderer();
  });

  it('returns a non-empty Uint8Array for minimal input', async () => {
    const result = await renderer.render(minimal);

    expect(result).toBeInstanceOf(Uint8Array);
    expect(result.length).toBeGreaterThan(100);
  });

  it('does not throw for empty sections', async () => {
    await expect(renderer.render({ name: 'Test', sections: [] })).resolves.toBeInstanceOf(Uint8Array);
  });

  it('does not throw when content overflows to multiple pages', async () => {
    await expect(renderer.render(long)).resolves.toBeInstanceOf(Uint8Array);
  });
});
