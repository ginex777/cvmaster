import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';
import { ConsentService } from '../../core/consent/consent.service';

describe('FooterComponent', () => {
  let openSettings: jest.Mock;

  beforeEach(async () => {
    openSettings = jest.fn();
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [
        provideRouter([]),
        { provide: ConsentService, useValue: { openSettings, needsBanner: () => false, consent: () => null } },
      ],
    }).compileComponents();
  });

  it('renders footer columns and copyright', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('PRODUKT');
    expect(text).toContain('RESSOURCEN');
    expect(text).toContain('RECHTLICHES');
    expect(text).toContain('© 2026 Lebenslauf-Agent GmbH');
  });

  it('renders Cookie-Einstellungen button', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Cookie-Einstellungen');
  });

  it('calls consent.openSettings() when Cookie-Einstellungen is clicked', () => {
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.footer__cookie-settings') as HTMLButtonElement;
    btn.click();
    expect(openSettings).toHaveBeenCalledTimes(1);
  });
});
