import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { CompanyLogoComponent } from './company-logo';

describe('CompanyLogoComponent', () => {
  let fixture: ComponentFixture<CompanyLogoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompanyLogoComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CompanyLogoComponent);
    fixture.componentRef.setInput('name', 'Stripe');
    fixture.detectChanges();
  });

  it('renders initials from a single word name', () => {
    const mono = fixture.nativeElement.querySelector('.logo__mono');
    expect(mono.textContent.trim()).toBe('S');
  });

  it('renders two-letter initials from a two-word name', () => {
    fixture.componentRef.setInput('name', 'Stripe Inc');
    fixture.detectChanges();
    const mono = fixture.nativeElement.querySelector('.logo__mono');
    expect(mono.textContent.trim()).toBe('SI');
  });

  it('applies default size of 32px', () => {
    const mono = fixture.nativeElement.querySelector('.logo__mono');
    expect(mono.style.width).toBe('32px');
    expect(mono.style.height).toBe('32px');
  });

  it('applies custom size', () => {
    fixture.componentRef.setInput('size', 44);
    fixture.detectChanges();
    const mono = fixture.nativeElement.querySelector('.logo__mono');
    expect(mono.style.width).toBe('44px');
    expect(mono.style.height).toBe('44px');
  });

  it('renders img when imageUrl is provided', () => {
    fixture.componentRef.setInput('imageUrl', 'https://example.com/logo.png');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img');
    expect(img).not.toBeNull();
    expect(img.src).toBe('https://example.com/logo.png');
  });
});
