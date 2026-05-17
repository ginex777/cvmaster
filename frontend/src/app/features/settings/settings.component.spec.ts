import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SettingsComponent } from './settings.component';

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
  });

  it('renders the page title', () => {
    const h1 = fixture.nativeElement.querySelector('h1');
    expect(h1.textContent.trim()).toBe('Einstellungen');
  });

  it('has links to Sicherheit, Abrechnung, and Daten', () => {
    const links = fixture.nativeElement.querySelectorAll('a.settings-nav__item');
    const hrefs = Array.from(links).map(l => (l as HTMLAnchorElement).getAttribute('routerlink') ?? (l as HTMLAnchorElement).getAttribute('href') ?? '');
    expect(hrefs.some(h => h.includes('security'))).toBe(true);
    expect(hrefs.some(h => h.includes('billing'))).toBe(true);
    expect(hrefs.some(h => h.includes('data'))).toBe(true);
  });
});
