import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';

describe('LandingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
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
});
