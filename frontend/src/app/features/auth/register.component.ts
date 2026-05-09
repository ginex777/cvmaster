import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'lba-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private http   = inject(HttpClient);
  private router = inject(Router);

  name        = signal('');
  email       = signal('');
  password    = signal('');
  art9Consent = signal(false);
  loading     = signal(false);
  error       = signal('');

  async submit() {
    if (!this.art9Consent()) return;
    this.loading.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.http.post('/api/auth/register', {
        name: this.name(), email: this.email(), password: this.password(), art9Consent: true,
      }));
      await this.router.navigate(['/login'], { queryParams: { registered: '1' } });
    } catch (e: unknown) {
      const msg = (e as { error?: { message?: string } })?.error?.message;
      this.error.set(msg ?? 'Registrierung fehlgeschlagen.');
    } finally {
      this.loading.set(false);
    }
  }
}
