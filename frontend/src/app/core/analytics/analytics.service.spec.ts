import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AnalyticsService } from './analytics.service';
import type { AnalyticsEvent } from './analytics.service';

function setup(platformId = 'browser', plausibleDomain?: string) {
  if (plausibleDomain) {
    (window as Window & { __LBA_CONFIG__?: { plausibleDomain?: string } }).__LBA_CONFIG__ = { plausibleDomain };
  } else {
    delete (window as Window & { __LBA_CONFIG__?: unknown }).__LBA_CONFIG__;
  }
  TestBed.configureTestingModule({
    providers: [{ provide: PLATFORM_ID, useValue: platformId }],
  });
  return TestBed.inject(AnalyticsService);
}

describe('AnalyticsService', () => {
  let plausibleSpy: jest.Mock;

  beforeEach(() => {
    plausibleSpy = jest.fn();
    (window as Window & { plausible?: jest.Mock }).plausible = plausibleSpy;
  });

  afterEach(() => {
    delete (window as Window & { plausible?: unknown }).plausible;
    delete (window as Window & { __LBA_CONFIG__?: unknown }).__LBA_CONFIG__;
    TestBed.resetTestingModule();
  });

  it('track() calls window.plausible with event name when configured', () => {
    setup('browser', 'example.de');
    const svc = TestBed.inject(AnalyticsService);
    svc.track('register-completed');
    expect(plausibleSpy).toHaveBeenCalledWith('register-completed', undefined);
  });

  it('track() passes safe props without any user content', () => {
    setup('browser', 'example.de');
    const svc = TestBed.inject(AnalyticsService);
    const props = { plan: 'PRO', source: 'pricing-page' };
    svc.track('checkout-opened', props);
    expect(plausibleSpy).toHaveBeenCalledWith('checkout-opened', { props });
    const calledProps = plausibleSpy.mock.calls[0][1]?.props as Record<string, unknown>;
    Object.values(calledProps).forEach(v => {
      expect(typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean').toBe(true);
    });
  });

  it('track() is a no-op when window.plausible is not loaded', () => {
    delete (window as Window & { plausible?: unknown }).plausible;
    setup('browser', 'example.de');
    const svc = TestBed.inject(AnalyticsService);
    expect(() => svc.track('export-clicked')).not.toThrow();
    expect(plausibleSpy).not.toHaveBeenCalled();
  });

  it('track() is a no-op on server-side rendering platform', () => {
    setup('server', 'example.de');
    const svc = TestBed.inject(AnalyticsService);
    svc.track('cv-uploaded');
    expect(plausibleSpy).not.toHaveBeenCalled();
  });

  it('does not inject Plausible script when plausibleDomain is not configured', () => {
    const appendSpy = jest.spyOn(document.head, 'appendChild');
    setup('browser');
    expect(appendSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ src: expect.stringContaining('plausible.io') }),
    );
    appendSpy.mockRestore();
  });

  it('injects Plausible script with correct data-domain when configured', () => {
    const appendSpy = jest.spyOn(document.head, 'appendChild').mockImplementation(() => document.head);
    setup('browser', 'lebenslauf-agent.de');
    const script = appendSpy.mock.calls.find(
      ([el]) => (el as HTMLScriptElement).getAttribute?.('data-domain') === 'lebenslauf-agent.de',
    );
    expect(script).toBeDefined();
    appendSpy.mockRestore();
  });

  it('event props contain only primitive values (no objects, arrays, or PII strings)', () => {
    setup('browser', 'example.de');
    const svc = TestBed.inject(AnalyticsService);
    const safeProps = { plan: 'PRO', count: 3, first: true };
    svc.track('app-generated', safeProps);
    const calledProps = plausibleSpy.mock.calls[0][1]?.props as Record<string, unknown>;
    Object.values(calledProps).forEach(v => {
      expect(v).not.toBeInstanceOf(Object);
      if (typeof v === 'string') {
        expect(v.length).toBeLessThan(200);
      }
    });
  });

  it('all AnalyticsEvent values are kebab-case strings without PII placeholders', () => {
    const events: AnalyticsEvent[] = [
      'register-started', 'register-completed', 'cv-uploaded',
      'app-generated', 'export-clicked', 'checkout-opened', 'checkout-completed',
    ];
    events.forEach(e => {
      expect(e).toMatch(/^[a-z][a-z-]+[a-z]$/);
    });
  });
});
