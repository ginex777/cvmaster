import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should compose all landing sections', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('lba-navbar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-hero')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-logo-bar')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-features-grid')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-workflow-steps')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-before-after')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-testimonials')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-pricing-inline')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-cta-band')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('lba-footer')).toBeTruthy();
  });

  it('routes landing auth CTAs to dedicated auth pages instead of opening modals', () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('[role="dialog"]')).toBeNull();
    expect(html.querySelector('a[href="/login"]')?.textContent).toContain('Anmelden');
    expect(html.querySelectorAll('a[href="/register"]').length).toBeGreaterThanOrEqual(3);
  });
});
