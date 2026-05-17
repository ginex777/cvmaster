import { scoreClass, scoreBg, scoreColor, scoreLabel } from './score.utils';

describe('scoreClass', () => {
  it('returns score--high for >= 80', () => expect(scoreClass(80)).toBe('score--high'));
  it('returns score--high for 100', () => expect(scoreClass(100)).toBe('score--high'));
  it('returns score--mid for 60–79', () => expect(scoreClass(60)).toBe('score--mid'));
  it('returns score--mid for 79', () => expect(scoreClass(79)).toBe('score--mid'));
  it('returns score--low for < 60', () => expect(scoreClass(59)).toBe('score--low'));
  it('returns score--low for 0', () => expect(scoreClass(0)).toBe('score--low'));
});

describe('scoreColor', () => {
  it('returns status-offer token for >= 80', () => expect(scoreColor(80)).toBe('var(--status-offer)'));
  it('returns status-applied token for 60–79', () => expect(scoreColor(60)).toBe('var(--status-applied)'));
  it('returns warn token for < 60', () => expect(scoreColor(59)).toBe('var(--warn)'));
});

describe('scoreBg', () => {
  it('returns green tint for >= 80', () => expect(scoreBg(80)).toBe('oklch(95% 0.04 155)'));
  it('returns blue tint for 60–79', () => expect(scoreBg(65)).toBe('oklch(95% 0.025 240)'));
  it('returns amber tint for < 60', () => expect(scoreBg(40)).toBe('oklch(96% 0.03 60)'));
});

describe('scoreLabel', () => {
  it('returns Stark for >= 80', () => expect(scoreLabel(80)).toBe('Stark'));
  it('returns Gut for 60–79', () => expect(scoreLabel(70)).toBe('Gut'));
  it('returns Verbesserbar for < 60', () => expect(scoreLabel(50)).toBe('Verbesserbar'));
});
