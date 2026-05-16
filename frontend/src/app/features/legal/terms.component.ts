import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FooterComponent } from '../../shared/components/footer.component';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'lba-terms',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './terms.component.html',
  styleUrl: './terms.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsComponent {
  constructor() {
    inject(SeoService).setPage(
      'Allgemeine Geschäftsbedingungen',
      'AGB für die Nutzung von Hireflow AI.',
      '/agb',
    );
  }
}
