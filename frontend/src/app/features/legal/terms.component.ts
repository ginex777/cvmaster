import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FooterComponent } from '../../shared/components/footer.component';
import { NavbarComponent } from '../../shared/components/navbar.component';

@Component({
  selector: 'lba-terms',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsComponent {}
