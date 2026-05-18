import type { OnDestroy, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconsModule } from '../icons/icons.module';

@Component({
  selector: 'lba-navbar',
  standalone: true,
  imports: [RouterLink, IconsModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  readonly loginRequested = output<void>();
  readonly registerRequested = output<void>();

  protected readonly scrolled = signal(false);

  private readonly listener = () => this.scrolled.set(window.scrollY > 50);

  ngOnInit(): void {
    if (typeof window === 'undefined') {
      return;
    }

    this.listener();
    window.addEventListener('scroll', this.listener, { passive: true });
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined') {
      return;
    }

    window.removeEventListener('scroll', this.listener);
  }
}
