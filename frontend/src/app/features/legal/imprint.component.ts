import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FooterComponent } from '../../shared/components/footer.component';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'lba-imprint',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImprintComponent {}
