import { describe, expect, it } from '@jest/globals';
import { TrialService } from './trial.service';

describe('TrialService', () => {
  it('scores matched job keywords against the cv text', () => {
    const service = new TrialService();

    const result = service.analyze({
      cvText:
        'Ich entwickle Angular Anwendungen mit TypeScript, Accessibility Audits, Design Systems und REST APIs.',
      jobText:
        'Gesucht wird Erfahrung mit Angular, TypeScript, Accessibility, Playwright, REST APIs und Design Systems.',
    });

    expect(result.matchScore).toBeGreaterThan(40);
    expect(result.matchedKeywords).toContain('angular');
    expect(result.missingKeywords).toContain('playwright');
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
