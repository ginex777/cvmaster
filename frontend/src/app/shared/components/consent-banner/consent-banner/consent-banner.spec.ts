import { TestBed, type ComponentFixture } from '@angular/core/testing';

import { ConsentBanner } from './consent-banner';

describe('ConsentBanner', () => {
  let component: ConsentBanner;
  let fixture: ComponentFixture<ConsentBanner>;

  beforeEach(async () => {
    localStorage.clear();
    document.head.querySelectorAll('script[src="https://client.crisp.chat/l.js"]').forEach(script => script.remove());
    delete (window as Window & { __LBA_CONFIG__?: unknown; $crisp?: unknown; CRISP_WEBSITE_ID?: string }).__LBA_CONFIG__;
    delete (window as Window & { __LBA_CONFIG__?: unknown; $crisp?: unknown; CRISP_WEBSITE_ID?: string }).$crisp;
    delete (window as Window & { __LBA_CONFIG__?: unknown; $crisp?: unknown; CRISP_WEBSITE_ID?: string }).CRISP_WEBSITE_ID;

    await TestBed.configureTestingModule({
      imports: [ConsentBanner],
    }).compileComponents();

    fixture = TestBed.createComponent(ConsentBanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders support consent settings and stores necessary-only consent', () => {
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Support-Cookies verwalten');

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find(button => button.textContent?.includes('Nur notwendige'))?.click();
    fixture.detectChanges();

    expect(component.consent.needsBanner()).toBe(false);
    expect(localStorage.getItem('consent_v1')).toContain('"support":false');
    expect(document.head.querySelector('script[src="https://client.crisp.chat/l.js"]')).toBeNull();
  });

  it('loads Crisp only after support consent with configured website id', () => {
    (window as Window & { __LBA_CONFIG__?: { crispWebsiteId: string } }).__LBA_CONFIG__ = {
      crispWebsiteId: 'crisp-id',
    };
    fixture.detectChanges();

    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find(button => button.textContent?.includes('Alle akzeptieren'))?.click();
    fixture.detectChanges();

    expect((window as Window & { CRISP_WEBSITE_ID?: string }).CRISP_WEBSITE_ID).toBe('crisp-id');
    expect(document.head.querySelector('script[src="https://client.crisp.chat/l.js"]')).toBeTruthy();
  });

  it('lets users reopen settings and revoke consent', () => {
    component.consent.acceptNecessary();
    fixture.detectChanges();

    expect(component.consent.needsBanner()).toBe(false);
    (fixture.nativeElement.querySelector('.consent-settings') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.consent.needsBanner()).toBe(true);
    const buttons = Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    buttons.find(button => button.textContent?.includes('Widerrufen'))?.click();

    expect(localStorage.getItem('consent_v1')).toBeNull();
    expect(component.consent.needsBanner()).toBe(true);
  });
});
