import { TestBed } from '@angular/core/testing';
import { TestimonialsComponent } from './testimonials.component';

describe('TestimonialsComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestimonialsComponent] }).compileComponents();
  });

  it('renders testimonial authors', () => {
    const fixture = TestBed.createComponent(TestimonialsComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Marek S.');
    expect(text).toContain('Anita K.');
    expect(text).toContain('Tobias R.');
  });
});
