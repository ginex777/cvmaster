import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FaqComponent } from './faq.component';

describe('FaqComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FaqComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders FAQ heading', () => {
    const fixture = TestBed.createComponent(FaqComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toContain('Häufige Fragen');
  });

  it('renders all three FAQ sections', () => {
    const fixture = TestBed.createComponent(FaqComponent);
    fixture.detectChanges();
    const sections = fixture.nativeElement.querySelectorAll('.faq-section');
    expect(sections.length).toBe(3);
  });

  it('renders FAQ items as buttons with aria-expanded="false" initially', () => {
    const fixture = TestBed.createComponent(FaqComponent);
    fixture.detectChanges();
    const buttons = fixture.nativeElement.querySelectorAll('.faq-item__question');
    expect(buttons.length).toBeGreaterThanOrEqual(8);
    for (const btn of Array.from(buttons) as HTMLButtonElement[]) {
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    }
  });

  it('injects JSON-LD structured data into document head', () => {
    const fixture = TestBed.createComponent(FaqComponent);
    fixture.detectChanges();
    const scripts = Array.from(document.head.querySelectorAll('script[type="application/ld+json"]')) as HTMLScriptElement[];
    const faqScript = scripts.find(s => s.textContent?.includes('FAQPage'));
    expect(faqScript).toBeTruthy();
    const data = JSON.parse(faqScript?.textContent ?? '{}') as { '@type': string };
    expect(data['@type']).toBe('FAQPage');
  });

  it('security.txt link is present in security answer', () => {
    const fixture = TestBed.createComponent(FaqComponent);
    fixture.detectChanges();
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    expect(links.some(l => l.href.includes('security.txt') || l.href.includes('security@'))).toBe(true);
  });
});
