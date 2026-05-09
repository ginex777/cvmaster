import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TrialApiService } from '../../core/api/trial.service';
import { TryComponent } from './try.component';

describe('TryComponent', () => {
  let trialApi: jest.Mocked<Pick<TrialApiService, 'analyze'>>;

  beforeEach(async () => {
    trialApi = { analyze: jest.fn() };
    trialApi.analyze.mockResolvedValue({
      atsScore: 82,
      matchScore: 82,
      keywords: ['React'],
      coverLetterPreview: 'Preview text',
      summary: 'Good fit',
      suggestions: [],
      matchedKeywords: ['React'],
      missingKeywords: [],
      keywordMatches: [{ keyword: 'React', matched: true }],
    });

    await TestBed.configureTestingModule({
      imports: [TryComponent],
      providers: [
        provideRouter([]),
        { provide: TrialApiService, useValue: trialApi },
      ],
    }).compileComponents();
  });

  it('renders two textareas', () => {
    const fixture = TestBed.createComponent(TryComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('textarea').length).toBe(2);
  });

  it('POST /trial result is shown as score and preview', async () => {
    const fixture = TestBed.createComponent(TryComponent);
    fixture.componentInstance.form.setValue({
      cvText: 'This CV text is long enough and mentions React application work.',
      jobText: 'This job posting is long enough and asks for React application work.',
    });

    await fixture.componentInstance.runTrial();
    fixture.detectChanges();

    expect(trialApi.analyze).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('82%');
    expect(fixture.nativeElement.textContent).toContain('Preview text');
  });

  it('error signal is set when API throws', async () => {
    trialApi.analyze.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Fehler' } }));
    const fixture = TestBed.createComponent(TryComponent);
    fixture.componentInstance.form.setValue({
      cvText: 'This CV text is long enough and mentions React application work.',
      jobText: 'This job posting is long enough and asks for React application work.',
    });

    await fixture.componentInstance.runTrial();

    expect(fixture.componentInstance.error()).toBe('Fehler');
  });
});
