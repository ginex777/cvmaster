import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FooterComponent } from '../../shared/components/footer.component';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'lba-privacy',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {}
