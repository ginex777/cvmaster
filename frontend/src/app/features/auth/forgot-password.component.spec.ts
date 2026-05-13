import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ForgotPasswordComponent } from './forgot-password.component';
import { ApiService } from '../../core/api/api.service';

describe('ForgotPasswordComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'post'>>;

  beforeEach(async () => {
    api = { post: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
      ],
    }).compileComponents();
  });

  it('loading is true during submission, false after', async () => {
    let resolve!: (v: unknown) => void;
    api.post.mockReturnValue(new Promise((r) => { resolve = r; }));
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.componentInstance.form.setValue({ email: 'a@b.de' });
    const p = fixture.componentInstance.submit();
    expect(fixture.componentInstance.loading()).toBe(true);
    resolve({});
    await p;
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('sets sent signal to true on success', async () => {
    api.post.mockResolvedValue({});
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.componentInstance.form.setValue({ email: 'a@b.de' });
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.sent()).toBe(true);
  });

  it('sets error signal on API failure', async () => {
    api.post.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Rate limit' } }));
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.componentInstance.form.setValue({ email: 'a@b.de' });
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe('Rate limit');
  });

  it('calls POST /auth/forgot-password with email', async () => {
    api.post.mockResolvedValue({});
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.componentInstance.form.setValue({ email: 'test@example.de' });
    await fixture.componentInstance.submit();
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'test@example.de' });
  });
});
