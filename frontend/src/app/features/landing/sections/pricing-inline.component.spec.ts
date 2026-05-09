import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PricingInlineComponent } from './pricing-inline.component';

describe('PricingInlineComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingInlineComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders both pricing options and badge', () => {
    const fixture = TestBed.createComponent(PricingInlineComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('4,90 €');
    expect(text).toContain('14 €');
    expect(text).toContain('EMPFOHLEN');
  });
});
