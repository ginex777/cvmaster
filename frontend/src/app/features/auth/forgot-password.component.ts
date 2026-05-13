import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'lba-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ForgotPasswordComponent {
  private readonly api = inject(ApiService);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly sent = signal(false);

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
  });

  constructor() {
    inject(SeoService).setPage('Passwort zurücksetzen', 'Passwort-Reset per E-Mail anfordern.', '/forgot-password');
  }

  async submit(): Promise<void> {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.api.post('/auth/forgot-password', { email: this.form.controls.email.value });
      this.sent.set(true);
    } catch (e: unknown) {
      this.error.set(e instanceof HttpErrorResponse ? e.error.message : 'Ein Fehler ist aufgetreten.');
    } finally {
      this.loading.set(false);
    }
  }
}
