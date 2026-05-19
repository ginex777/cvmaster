import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'lba-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') ?? '';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = new FormGroup({
    newPassword: new FormControl('', [Validators.required, Validators.minLength(12)]),
    confirmPassword: new FormControl('', [Validators.required]),
  });

  get tokenMissing(): boolean { return !this.token; }

  constructor() {
    inject(SeoService).setPage('Neues Passwort setzen', 'Neues Passwort für dein Konto setzen.', '/reset-password');
  }

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { newPassword, confirmPassword } = this.form.value;
    if (newPassword !== confirmPassword) {
      this.error.set('Die Passwörter stimmen nicht überein.');
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.api.post('/auth/reset-password', { token: this.token, newPassword });
      await this.router.navigate(['/login'], { queryParams: { reset: '1' } });
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Der Link zum Zurücksetzen ist ungültig oder abgelaufen.');
    } finally {
      this.loading.set(false);
    }
  }
}
