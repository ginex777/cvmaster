import { TestBed } from '@angular/core/testing';
import { AtsPanel } from './ats-panel';
import type { AtsMatchReport, OptimizationDiffEntry } from './ats-panel';

const matchReport: AtsMatchReport = {
  summary: 'Solide Basis',
  matchedKeywords: ['Angular', 'TypeScript'],
  missingKeywords: ['Docker', 'AWS'],
  risks: ['Docker'],
};

const diffEntries: OptimizationDiffEntry[] = [
  {
    section: 'Dev @ Acme',
    before: 'Built things',
    after: 'Built 5 things',
    reason: 'Added metrics',
  },
];

describe('AtsPanel', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AtsPanel],
    }).compileComponents();
  });

  it('renders the score ring and label', () => {
    const fixture = TestBed.createComponent(AtsPanel);
    fixture.componentRef.setInput('score', 85);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', diffEntries);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sehr gut');
    expect(fixture.nativeElement.querySelector('lba-score-ring')).toBeTruthy();
  });

  it('renders green chips for matched keywords', () => {
    const fixture = TestBed.createComponent(AtsPanel);
    fixture.componentRef.setInput('score', 75);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', null);
    fixture.detectChanges();

    const greenChips = fixture.nativeElement.querySelectorAll('.ats-panel__chip--matched');
    expect(greenChips.length).toBe(2);
    expect(greenChips[0].textContent.trim()).toBe('Angular');
  });

  it('renders red chips for required missing keywords', () => {
    const fixture = TestBed.createComponent(AtsPanel);
    fixture.componentRef.setInput('score', 40);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', null);
    fixture.detectChanges();

    const redChips = fixture.nativeElement.querySelectorAll('.ats-panel__chip--missing-required');
    expect(redChips.length).toBe(1);
    expect(redChips[0].textContent.trim()).toBe('Docker');
  });

  it('renders orange chips for optional missing keywords', () => {
    const fixture = TestBed.createComponent(AtsPanel);
    fixture.componentRef.setInput('score', 40);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', null);
    fixture.detectChanges();

    const orangeChips = fixture.nativeElement.querySelectorAll('.ats-panel__chip--missing-optional');
    expect(orangeChips.length).toBe(1);
    expect(orangeChips[0].textContent.trim()).toBe('AWS');
  });

  it('renders diff entries with before, after, and reason', () => {
    const fixture = TestBed.createComponent(AtsPanel);
    fixture.componentRef.setInput('score', 75);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', diffEntries);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Built things');
    expect(text).toContain('Built 5 things');
    expect(text).toContain('Added metrics');
    expect(text).toContain('Dev @ Acme');
  });

  it('shows neutral state when score is null', () => {
    const fixture = TestBed.createComponent(AtsPanel);
    fixture.componentRef.setInput('score', null);
    fixture.componentRef.setInput('matchReport', null);
    fixture.componentRef.setInput('optimizationDiff', null);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Analyse nicht verfuegbar');
  });

  it('has an aria-label on the score status region', () => {
    const fixture = TestBed.createComponent(AtsPanel);
    fixture.componentRef.setInput('score', 70);
    fixture.componentRef.setInput('matchReport', matchReport);
    fixture.componentRef.setInput('optimizationDiff', null);
    fixture.detectChanges();

    const scoreRegion = fixture.nativeElement.querySelector('[role="status"]');
    expect(scoreRegion).toBeTruthy();
    expect(scoreRegion.getAttribute('aria-label')).toContain('70');
  });
});
