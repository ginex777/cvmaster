import { ChangeDetectionStrategy, Component, inject, type OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { FooterComponent } from '../../shared/components/footer.component';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { SeoService } from '../../core/seo/seo.service';

const FAQ_LD_JSON = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Was ist Hireflow AI?',
      acceptedAnswer: { '@type': 'Answer', text: 'Hireflow AI ist ein KI-gestütztes Tool, das deinen Lebenslauf automatisch auf jede Stellenanzeige optimiert und ein passendes Anschreiben generiert.' },
    },
    {
      '@type': 'Question',
      name: 'Ist der Dienst DSGVO-konform?',
      acceptedAnswer: { '@type': 'Answer', text: 'Ja. Hireflow AI wird in Deutschland betrieben und verarbeitet Daten nach DSGVO. Dateien werden nie dauerhaft gespeichert.' },
    },
    {
      '@type': 'Question',
      name: 'Wie viele Bewerbungen kann ich kostenlos erstellen?',
      acceptedAnswer: { '@type': 'Answer', text: 'Neue Accounts erhalten eine kostenlose Testbewerbung ohne Kreditkarte.' },
    },
  ],
});

@Component({
  selector: 'lba-faq',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  templateUrl: './faq.component.html',
  styleUrl: './faq.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FaqComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly ldScript: HTMLScriptElement;

  constructor() {
    inject(SeoService).setPage(
      'FAQ – Häufige Fragen',
      'Antworten auf die häufigsten Fragen zu Hireflow AI: Datenschutz, Formate, KI, Preise und mehr.',
      '/faq',
    );

    this.ldScript = this.document.createElement('script');
    this.ldScript.type = 'application/ld+json';
    this.ldScript.textContent = FAQ_LD_JSON;
    this.document.head.appendChild(this.ldScript);
  }

  ngOnDestroy(): void {
    this.ldScript.remove();
  }
}
