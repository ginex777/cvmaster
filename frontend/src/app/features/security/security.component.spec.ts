import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { SecurityComponent } from './security.component';
import { ApiService } from '../../core/api/api.service';

const mockSessions = [
  { id: 's1', createdAt: '2026-01-01T00:00:00Z', lastUsedAt: '2026-05-01T10:00:00Z', userAgent: 'Chrome/124' },
  { id: 's2', createdAt: '2026-02-01T00:00:00Z', lastUsedAt: '2026-05-10T08:00:00Z', userAgent: 'Firefox/125' },
];

describe('SecurityComponent', () => {
  let api: jest.Mocked<Pick<ApiService, 'get' | 'post' | 'delete'>>;

  beforeEach(async () => {
    api = { get: jest.fn(), post: jest.fn(), delete: jest.fn() };
    await TestBed.configureTestingModule({
      imports: [SecurityComponent],
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
      ],
    }).compileComponents();
  });

  it('loads sessions on init', async () => {
    api.get.mockResolvedValue(mockSessions);
    const fixture = TestBed.createComponent(SecurityComponent);
    await fixture.componentInstance.ngOnInit();
    expect(fixture.componentInstance.sessions()).toEqual(mockSessions);
  });

  it('sets sessionsError on session load failure', async () => {
    api.get.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Forbidden' } }));
    const fixture = TestBed.createComponent(SecurityComponent);
    await fixture.componentInstance.loadSessions();
    expect(fixture.componentInstance.sessionsError()).toBe('Forbidden');
  });

  it('removes session from list after revoke', async () => {
    api.get.mockResolvedValue(mockSessions);
    api.delete.mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(SecurityComponent);
    await fixture.componentInstance.ngOnInit();
    await fixture.componentInstance.revokeSession('s1');
    expect(fixture.componentInstance.sessions().map(s => s.id)).toEqual(['s2']);
  });

  it('passwordSuccess is true on successful password change', async () => {
    api.post.mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(SecurityComponent);
    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword456!',
      confirmPassword: 'newpassword456!',
    });
    await fixture.componentInstance.changePassword();
    expect(fixture.componentInstance.passwordSuccess()).toBe(true);
  });

  it('sets passwordError when new passwords do not match', async () => {
    const fixture = TestBed.createComponent(SecurityComponent);
    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'oldpassword123',
      newPassword: 'newpassword456!',
      confirmPassword: 'differentpass99',
    });
    await fixture.componentInstance.changePassword();
    expect(fixture.componentInstance.passwordError()).toBe('Die neuen Passwörter stimmen nicht überein.');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('sets passwordError on API failure', async () => {
    api.post.mockRejectedValue(new HttpErrorResponse({ error: { message: 'Falsches Passwort' } }));
    const fixture = TestBed.createComponent(SecurityComponent);
    fixture.componentInstance.passwordForm.setValue({
      currentPassword: 'wrongpassword1',
      newPassword: 'newpassword456!',
      confirmPassword: 'newpassword456!',
    });
    await fixture.componentInstance.changePassword();
    expect(fixture.componentInstance.passwordError()).toBe('Falsches Passwort');
  });

  it('sets totpSetup on setupTotp success', async () => {
    api.post.mockResolvedValue({ secret: 'ABCDEF', uri: 'otpauth://totp/test' });
    const fixture = TestBed.createComponent(SecurityComponent);
    await fixture.componentInstance.setupTotp();
    expect(fixture.componentInstance.totpSetup()).toEqual({ secret: 'ABCDEF', uri: 'otpauth://totp/test' });
  });

  it('sets totpEnabled to true on enableTotp success', async () => {
    api.post.mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(SecurityComponent);
    fixture.componentInstance.totpEnableForm.setValue({ code: '123456' });
    await fixture.componentInstance.enableTotp();
    expect(fixture.componentInstance.totpEnabled()).toBe(true);
  });

  it('sets totpEnabled to false on disableTotp success', async () => {
    api.post.mockResolvedValue(undefined);
    const fixture = TestBed.createComponent(SecurityComponent);
    fixture.componentInstance.totpEnabled.set(true);
    fixture.componentInstance.totpDisableForm.setValue({ password: 'mypassword123' });
    await fixture.componentInstance.disableTotp();
    expect(fixture.componentInstance.totpEnabled()).toBe(false);
  });
});
