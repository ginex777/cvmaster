import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CtaBandComponent } from './cta-band.component';

describe('CtaBandComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CtaBandComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders CTA heading and trust text', () => {
    const fixture = TestBed.createComponent(CtaBandComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Deine nächste Bewerbung');
    expect(text).toContain('Keine Kreditkarte');
  });
});
