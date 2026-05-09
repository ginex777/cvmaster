import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should show error message on failed login', async () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.error.set('Ungültige Anmeldedaten');
    fixture.detectChanges();
    const errorEl = fixture.nativeElement.querySelector('.form-error');
    expect(errorEl).toBeTruthy();
  });
});
