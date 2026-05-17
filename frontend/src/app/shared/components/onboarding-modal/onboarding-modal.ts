import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../../core/api/api.service';
import { IconsModule } from '../../icons/icons.module';

interface Step {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

const STEPS: Step[] = [
  { id: 'cv', icon: 'file-text', title: 'Lebenslauf hochladen', desc: 'Lade deinen Lebenslauf als PDF oder DOCX hoch — die KI extrahiert alles automatisch.' },
  { id: 'app', icon: 'briefcase', title: 'Erste Bewerbung erstellen', desc: 'Gib eine Stellenanzeige ein, die KI optimiert deinen CV und schreibt ein passendes Anschreiben.' },
  { id: 'export', icon: 'download', title: 'Unterlagen exportieren', desc: 'Lade deine fertigen Bewerbungsunterlagen als professionelles PDF herunter.' },
];

@Component({
  selector: 'lba-onboarding-modal',
  standalone: true,
  imports: [IconsModule],
  templateUrl: './onboarding-modal.html',
  styleUrl: './onboarding-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OnboardingModalComponent {
  private readonly api = inject(ApiService);

  readonly dismissed = output<void>();

  readonly steps = STEPS;
  readonly loading = signal(false);

  async dismiss(): Promise<void> {
    this.loading.set(true);
    try {
      await this.api.post('/users/me/dismiss-onboarding', {});
    } catch (e: unknown) {
      if (!(e instanceof HttpErrorResponse)) throw e;
    } finally {
      this.loading.set(false);
    }
    this.dismissed.emit();
  }

  close(): void {
    this.dismissed.emit();
  }
}
