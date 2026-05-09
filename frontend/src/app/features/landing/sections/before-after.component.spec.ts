import { TestBed } from '@angular/core/testing';
import { BeforeAfterComponent } from './before-after.component';

describe('BeforeAfterComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BeforeAfterComponent] }).compileComponents();
  });

  it('renders before and after example with stats', () => {
    const fixture = TestBed.createComponent(BeforeAfterComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Vorher');
    expect(text).toContain('Nachher');
    expect(text).toContain('41%');
    expect(text).toContain('92%');
  });
});
