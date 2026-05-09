import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'lba-billing',
  standalone: true,
  imports: [],
  templateUrl: './billing.component.html',
  styleUrl: './billing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BillingComponent {
  auth = inject(AuthService);
}
