import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'lba-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent {
  private auth   = inject(AuthService);
  private router = inject(Router);

  email    = signal('');
  password = signal('');
  loading  = signal(false);
  error    = signal('');

  async submit() {
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.login(this.email(), this.password());
      await this.router.navigate(['/app']);
    } catch {
      this.error.set('E-Mail-Adresse oder Passwort ungültig.');
    } finally {
      this.loading.set(false);
    }
  }
}
