import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TryComponent } from './try.component';

describe('TryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TryComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(TryComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should start on cv step', () => {
    const fixture = TestBed.createComponent(TryComponent);
    expect(fixture.componentInstance.step()).toBe('cv');
  });
});
