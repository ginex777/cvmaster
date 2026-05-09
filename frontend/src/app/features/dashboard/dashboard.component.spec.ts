import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should map score >= 80 to score--high class', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance.scoreClass(85)).toBe('score--high');
    expect(fixture.componentInstance.scoreClass(65)).toBe('score--mid');
    expect(fixture.componentInstance.scoreClass(40)).toBe('score--low');
  });
});
