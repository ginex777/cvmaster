import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FooterComponent } from '../../shared/components/footer.component';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'lba-imprint',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImprintComponent {
  constructor() {
    inject(SeoService).setPage(
      'Impressum',
      'Pflichtangaben gemäß § 5 TMG für den Lebenslauf-Agenten.',
      '/impressum',
    );
  }
}
