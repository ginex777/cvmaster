import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NavbarComponent } from './navbar.component';

describe('NavbarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NavbarComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders navigation links and actions', () => {
    const fixture = TestBed.createComponent(NavbarComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Hireflow AI');
    expect(text).toContain('Features');
    expect(text).toContain("So funktioniert's");
    expect(text).toContain('Beispiel');
    expect(text).toContain('Preise');
    expect(text).toContain('Anmelden');
    expect(text).toContain('Kostenlos starten');
  });
});
