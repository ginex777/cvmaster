import { TestBed } from '@angular/core/testing';
import { Meta, Title } from '@angular/platform-browser';
import { SeoService } from './seo.service';

describe('SeoService', () => {
  let service: SeoService;
  let title: Title;
  let meta: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeoService);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);
  });

  it('sets page title with site suffix', () => {
    service.setPage('FAQ', 'Häufige Fragen', '/faq');
    expect(title.getTitle()).toBe('FAQ – Lebenslauf-Agent');
  });

  it('sets og:title and og:description meta tags', () => {
    service.setPage('FAQ', 'Häufige Fragen', '/faq');
    expect(meta.getTag('property="og:title"')?.content).toBe('FAQ – Lebenslauf-Agent');
    expect(meta.getTag('property="og:description"')?.content).toBe('Häufige Fragen');
  });

  it('sets og:url from path', () => {
    service.setPage('Preise', 'Preisübersicht', '/preise');
    expect(meta.getTag('property="og:url"')?.content).toBe('https://lebenslauf-agent.de/preise');
  });

  it('sets twitter:card to summary', () => {
    service.setPage('Home', 'KI-Bewerbungen', '/');
    expect(meta.getTag('name="twitter:card"')?.content).toBe('summary');
  });
});
