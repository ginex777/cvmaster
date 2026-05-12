import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'lba-app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected planLabel(): string {
    const plan = this.auth.user()?.plan;
    if (plan === 'PRO' || plan === 'pro') return 'Pro';
    if (plan === 'PAY_PER_APP' || plan === 'pay') return 'Pay-per-App';
    return 'Free';
  }

  protected planClass(): string {
    const plan = this.auth.user()?.plan;
    if (plan === 'PRO' || plan === 'pro') return 'pro';
    if (plan === 'PAY_PER_APP' || plan === 'pay') return 'pay';
    return 'free';
  }

  protected async logout(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/']);
  }
}
