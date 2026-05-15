import { HighlightPipe } from './highlight.pipe';

describe('HighlightPipe', () => {
  let pipe: HighlightPipe;

  beforeEach(() => { pipe = new HighlightPipe(); });

  it('returns original text when query is empty', () => {
    expect(pipe.transform('Frontend Developer', '')).toBe('Frontend Developer');
  });

  it('wraps matched substring in <mark>', () => {
    const result = pipe.transform('Frontend Developer', 'front');
    expect(result).toBe('<mark class="highlight">Front</mark>end Developer');
  });

  it('is case-insensitive', () => {
    const result = pipe.transform('Angular Expert', 'ANGULAR');
    expect(result).toContain('<mark class="highlight">Angular</mark>');
  });

  it('returns original text when query has no match', () => {
    expect(pipe.transform('Angular Expert', 'React')).toBe('Angular Expert');
  });

  it('handles multiple matches', () => {
    const result = pipe.transform('Frontend dev and Frontend designer', 'frontend');
    expect(result.match(/<mark/g)?.length).toBe(2);
  });

  it('escapes special regex characters in query', () => {
    expect(() => pipe.transform('some text', 'a.b*c')).not.toThrow();
  });
});
