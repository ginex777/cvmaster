import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { type OnInit, ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { IconsModule } from '../../shared/icons/icons.module';

interface Session {
  id: string;
  createdAt: string;
  lastUsedAt: string;
  userAgent: string | null;
}

interface TotpSetupData {
  secret: string;
  uri: string;
}

@Component({
  selector: 'lba-settings-security',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, RouterLink, IconsModule],
  templateUrl: './security.component.html',
  styleUrl: './security.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsSecurityComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly sessions = signal<Session[]>([]);
  readonly sessionsLoading = signal(false);
  readonly sessionsError = signal<string | null>(null);
  readonly passwordLoading = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal(false);
  readonly totpSetup = signal<TotpSetupData | null>(null);
  readonly totpEnabled = signal(false);
  readonly totpLoading = signal(false);
  readonly totpError = signal<string | null>(null);
  readonly totpSuccess = signal<string | null>(null);
  readonly revokingId = signal<string | null>(null);

  readonly passwordForm = new FormGroup({
    currentPassword: new FormControl('', [Validators.required]),
    newPassword: new FormControl('', [Validators.required, Validators.minLength(12)]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  readonly totpEnableForm = new FormGroup({
    code: new FormControl('', [Validators.required, Validators.pattern(/^\d{6}$/)]),
  });

  readonly totpDisableForm = new FormGroup({
    password: new FormControl('', [Validators.required]),
  });

  async ngOnInit(): Promise<void> {
    await this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    this.sessionsLoading.set(true);
    this.sessionsError.set(null);
    try {
      this.sessions.set(await this.api.get<Session[]>('/users/me/sessions'));
    } catch (e: unknown) {
      this.sessionsError.set(e instanceof HttpErrorResponse ? e.error.message : 'Sitzungen konnten nicht geladen werden.');
    } finally {
      this.sessionsLoading.set(false);
    }
  }

  async changePassword(): Promise<void> {
    if (this.passwordForm.invalid) { this.passwordForm.markAllAsTouched(); return; }
    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) { this.passwordError.set('Die neuen Passwörter stimmen nicht überein.'); return; }
    this.passwordLoading.set(true);
    this.passwordError.set(null);
    this.passwordSuccess.set(false);
    try {
      await this.api.post('/users/me/change-password', { currentPassword, newPassword });
      this.passwordSuccess.set(true);
      this.passwordForm.reset();
    } catch (e: unknown) {
      this.passwordError.set(e instanceof HttpErrorResponse ? e.error.message : 'Passwort konnte nicht geändert werden.');
    } finally {
      this.passwordLoading.set(false);
    }
  }

  async setupTotp(): Promise<void> {
    this.totpLoading.set(true);
    this.totpError.set(null);
    try {
      this.totpSetup.set(await this.api.post<TotpSetupData>('/users/me/totp/setup', {}));
    } catch (e: unknown) {
      this.totpError.set(e instanceof HttpErrorResponse ? e.error.message : '2FA konnte nicht eingerichtet werden.');
    } finally {
      this.totpLoading.set(false);
    }
  }

  async enableTotp(): Promise<void> {
    if (this.totpEnableForm.invalid) { this.totpEnableForm.markAllAsTouched(); return; }
    this.totpLoading.set(true);
    this.totpError.set(null);
    try {
      await this.api.post('/users/me/totp/enable', { code: this.totpEnableForm.value.code });
      this.totpEnabled.set(true);
      this.totpSetup.set(null);
      this.totpSuccess.set('Zwei-Faktor-Authentifizierung wurde aktiviert.');
      this.totpEnableForm.reset();
    } catch (e: unknown) {
      this.totpError.set(e instanceof HttpErrorResponse ? e.error.message : 'Code ungültig.');
    } finally {
      this.totpLoading.set(false);
    }
  }

  async disableTotp(): Promise<void> {
    if (this.totpDisableForm.invalid) { this.totpDisableForm.markAllAsTouched(); return; }
    this.totpLoading.set(true);
    this.totpError.set(null);
    try {
      await this.api.post('/users/me/totp/disable', { password: this.totpDisableForm.value.password });
      this.totpEnabled.set(false);
      this.totpSuccess.set('Zwei-Faktor-Authentifizierung wurde deaktiviert.');
      this.totpDisableForm.reset();
    } catch (e: unknown) {
      this.totpError.set(e instanceof HttpErrorResponse ? e.error.message : '2FA konnte nicht deaktiviert werden.');
    } finally {
      this.totpLoading.set(false);
    }
  }

  async revokeSession(id: string): Promise<void> {
    this.revokingId.set(id);
    try {
      await this.api.delete(`/users/me/sessions/${id}`);
      this.sessions.update(list => list.filter(s => s.id !== id));
    } catch (e: unknown) {
      this.sessionsError.set(e instanceof HttpErrorResponse ? e.error.message : 'Sitzung konnte nicht beendet werden.');
    } finally {
      this.revokingId.set(null);
    }
  }

  encodeURIComponent(value: string): string {
    return encodeURIComponent(value);
  }
}
