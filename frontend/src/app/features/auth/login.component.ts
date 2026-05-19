import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { IconsModule } from '../../shared/icons/icons.module';

@Component({
  selector: 'lba-login',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, IconsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly requiresTotp = signal(false);
  readonly justRegistered = this.route.snapshot.queryParams['registered'] === '1';

  readonly form = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required]),
    totp: new FormControl('', [Validators.pattern(/^\d{6}$/)]),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set(null);
    try {
      const v = this.form.getRawValue();
      await this.auth.login(v.email ?? '', v.password ?? '', v.totp?.trim() || undefined);
      await this.router.navigate(['/app']);
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse && e.error?.requires2fa) {
        this.requiresTotp.set(true);
        return;
      }
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Anmeldung fehlgeschlagen.',
      );
    } finally {
      this.loading.set(false);
    }
  }
}
