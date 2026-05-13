import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { FooterComponent } from '../../shared/components/footer.component';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SeoService } from '../../core/seo/seo.service';

@Component({
  selector: 'lba-privacy',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './privacy.component.html',
  styleUrl: './privacy.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyComponent {
  constructor() {
    inject(SeoService).setPage(
      'Datenschutzerklärung',
      'Informationen zum Datenschutz, zur DSGVO-konformen Verarbeitung deiner Daten und zu deinen Rechten.',
      '/datenschutz',
    );
  }
}
