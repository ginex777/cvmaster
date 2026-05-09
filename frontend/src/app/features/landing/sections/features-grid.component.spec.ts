import { TestBed } from '@angular/core/testing';
import { FeaturesGridComponent } from './features-grid.component';

describe('FeaturesGridComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FeaturesGridComponent] }).compileComponents();
  });

  it('renders the four feature cards', () => {
    const fixture = TestBed.createComponent(FeaturesGridComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('CV-Analyse in Sekunden');
    expect(text).toContain('Anschreiben-Generator');
    expect(text).toContain('ATS-Keyword-Optimierung');
    expect(text).toContain('Sauberer PDF-Export');
  });
});
