import { TestBed } from '@angular/core/testing';
import { BrowserModule } from '@angular/platform-browser';
import { HighlightPipe } from './highlight.pipe';

function asString(value: unknown): string {
  if (typeof value === 'string') return value;
  // SafeHtml wraps the string in an object
  return (value as { changingThisBreaksApplicationSecurity: string }).changingThisBreaksApplicationSecurity ?? String(value);
}

describe('HighlightPipe', () => {
  let pipe: HighlightPipe;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BrowserModule] });
    pipe = TestBed.runInInjectionContext(() => new HighlightPipe());
  });

  it('returns original text when query is empty', () => {
    expect(asString(pipe.transform('Frontend Developer', ''))).toBe('Frontend Developer');
  });

  it('returns original text when query is whitespace-only', () => {
    expect(asString(pipe.transform('Frontend Developer', '   '))).toBe('Frontend Developer');
  });

  it('wraps matched substring in <mark>', () => {
    const result = asString(pipe.transform('Frontend Developer', 'front'));
    expect(result).toBe('<mark class="highlight">Front</mark>end Developer');
  });

  it('is case-insensitive', () => {
    const result = asString(pipe.transform('Angular Expert', 'ANGULAR'));
    expect(result).toContain('<mark class="highlight">Angular</mark>');
  });

  it('returns original text when query has no match', () => {
    expect(asString(pipe.transform('Angular Expert', 'React'))).toBe('Angular Expert');
  });

  it('handles multiple matches', () => {
    const result = asString(pipe.transform('Frontend dev and Frontend designer', 'frontend'));
    expect(result.match(/<mark/g)?.length).toBe(2);
  });

  it('escapes special regex characters in query', () => {
    expect(() => pipe.transform('some text', 'a.b*c')).not.toThrow();
  });

  it('HTML-escapes text before inserting mark tags', () => {
    const result = asString(pipe.transform('<script>evil()</script>', 'script'));
    expect(result).not.toContain('<script>');
    expect(result).toContain('&lt;');
  });
});
