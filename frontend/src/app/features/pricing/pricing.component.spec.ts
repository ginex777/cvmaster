import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PricingComponent } from './pricing.component';

describe('PricingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PricingComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(PricingComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
