import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BillingComponent } from './billing.component';

describe('BillingComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillingComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(BillingComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
