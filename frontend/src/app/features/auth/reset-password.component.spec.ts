import { TestBed } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ResetPasswordComponent } from './reset-password.component';
import { ApiService } from '../../core/api/api.service';

describe('ResetPasswordComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'post'>>;

  async function setup(token: string | null = 'valid-token') {
    api = { post: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: (_: string) => token } } } },
      ],
    }).compileComponents();
    return TestBed.createComponent(ResetPasswordComponent);
  }

  it('tokenMissing is true when no token in query params', async () => {
    const fixture = await setup(null);
    expect(fixture.componentInstance.tokenMissing).toBe(true);
  });

  it('tokenMissing is false when token present', async () => {
    const fixture = await setup('abc123');
    expect(fixture.componentInstance.tokenMissing).toBe(false);
  });

  it('loading is true during submission, false after', async () => {
    const fixture = await setup();
    let resolve!: (v: unknown) => void;
    api.post.mockReturnValue(new Promise((r) => { resolve = r; }));
    fixture.componentInstance.form.setValue({ newPassword: 'securepassword1', confirmPassword: 'securepassword1' });
    const p = fixture.componentInstance.submit();
    expect(fixture.componentInstance.loading()).toBe(true);
    resolve({});
    await p;
    expect(fixture.componentInstance.loading()).toBe(false);
  });

  it('sets error when passwords do not match', async () => {
    const fixture = await setup();
    fixture.componentInstance.form.setValue({ newPassword: 'securepassword1', confirmPassword: 'differentpass2' });
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe('Die Passwörter stimmen nicht überein.');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('sets error signal on API failure', async () => {
    const fixture = await setup();
    api.post.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Token expired' } }));
    fixture.componentInstance.form.setValue({ newPassword: 'securepassword1', confirmPassword: 'securepassword1' });
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe('Token expired');
  });

  it('calls POST /auth/reset-password with token and newPassword', async () => {
    const fixture = await setup('my-token');
    api.post.mockResolvedValue({});
    fixture.componentInstance.form.setValue({ newPassword: 'securepassword1', confirmPassword: 'securepassword1' });
    await fixture.componentInstance.submit();
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token: 'my-token', newPassword: 'securepassword1' });
  });
});
