import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeroComponent } from './hero.component';

describe('HeroComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders headline, CTAs, and social proof', () => {
    const fixture = TestBed.createComponent(HeroComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Bewerbungen, die zur');
    expect(text).toContain('Bewerbung optimieren');
    expect(text).toContain("So funktioniert's");
    expect(text).toContain('4.900 Bewerbungen eingereicht');
  });
});
