import { beforeEach, describe, expect, it } from '@jest/globals';
import { DiffComputerService } from './diff-computer.service';
import type { ParsedCV } from '../ai/provider';

describe('DiffComputerService', () => {
  let service: DiffComputerService;

  beforeEach(() => {
    service = new DiffComputerService();
  });

  function makeCv(bullets: Array<{ id: string; text: string; reason?: string }>): ParsedCV {
    return {
      name: 'Test',
      experience: [{
        id: 'exp1',
        company: 'Acme',
        role: 'Developer',
        bullets,
      }],
      education: [],
      skills: [],
      languages: [],
    };
  }

  it('returns empty array when no bullets changed', () => {
    const original = makeCv([{ id: 'b1', text: 'Built widgets' }]);
    const optimized = makeCv([{ id: 'b1', text: 'Built widgets' }]);

    expect(service.compute(original, optimized)).toEqual([]);
  });

  it('creates a diff entry when bullet text changed', () => {
    const original = makeCv([{ id: 'b1', text: 'Built widgets' }]);
    const optimized = makeCv([{
      id: 'b1',
      text: 'Shipped 12 widgets, improving load time by 30%',
      reason: 'Added metrics',
    }]);

    const result = service.compute(original, optimized);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      section: 'Developer @ Acme',
      before: 'Built widgets',
      after: 'Shipped 12 widgets, improving load time by 30%',
      reason: 'Added metrics',
    });
  });

  it('uses empty string for reason when optimizer did not provide one', () => {
    const original = makeCv([{ id: 'b1', text: 'Old text' }]);
    const optimized = makeCv([{ id: 'b1', text: 'New text' }]);

    const result = service.compute(original, optimized);

    expect(result[0].reason).toBe('');
  });

  it('ignores bullets not present in original', () => {
    const original = makeCv([{ id: 'b1', text: 'Existing' }]);
    const optimized = makeCv([
      { id: 'b1', text: 'Existing' },
      { id: 'b2', text: 'New bullet added by AI', reason: 'New achievement' },
    ]);

    expect(service.compute(original, optimized)).toEqual([]);
  });

  it('handles multiple changed bullets across sections', () => {
    const original: ParsedCV = {
      name: 'Test',
      experience: [
        {
          id: 'exp1',
          company: 'Alpha',
          role: 'Dev',
          bullets: [
            { id: 'b1', text: 'Old 1' },
            { id: 'b2', text: 'Unchanged' },
          ],
        },
        {
          id: 'exp2',
          company: 'Beta',
          role: 'Lead',
          bullets: [{ id: 'b3', text: 'Old 3' }],
        },
      ],
      education: [],
      skills: [],
      languages: [],
    };
    const optimized: ParsedCV = {
      ...original,
      experience: [
        {
          id: 'exp1',
          company: 'Alpha',
          role: 'Dev',
          bullets: [
            { id: 'b1', text: 'New 1', reason: 'Quantified' },
            { id: 'b2', text: 'Unchanged' },
          ],
        },
        {
          id: 'exp2',
          company: 'Beta',
          role: 'Lead',
          bullets: [{ id: 'b3', text: 'New 3', reason: 'Impact added' }],
        },
      ],
    };

    const result = service.compute(original, optimized);

    expect(result).toHaveLength(2);
    expect(result[0].section).toBe('Dev @ Alpha');
    expect(result[1].section).toBe('Lead @ Beta');
  });

  it('clamps output to maximum 20 diff entries', () => {
    const bullets = Array.from({ length: 25 }, (_, i) => ({ id: `b${i}`, text: `Old ${i}` }));
    const optimizedBullets = bullets.map(b => ({ ...b, text: `New ${b.id}`, reason: 'Changed' }));
    const original = makeCv(bullets);
    const optimized = makeCv(optimizedBullets);

    expect(service.compute(original, optimized)).toHaveLength(20);
  });
});
