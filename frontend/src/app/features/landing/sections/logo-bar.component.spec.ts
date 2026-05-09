import { TestBed } from '@angular/core/testing';
import { LogoBarComponent } from './logo-bar.component';

describe('LogoBarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LogoBarComponent] }).compileComponents();
  });

  it('renders company names', () => {
    const fixture = TestBed.createComponent(LogoBarComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Erfolgreich beworben bei');
    expect(text).toContain('Northwind');
    expect(text).toContain('Kestrel');
  });
});
