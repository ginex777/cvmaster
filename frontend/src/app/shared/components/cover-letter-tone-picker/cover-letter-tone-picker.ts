import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type CoverLetterTone = 'formal' | 'modern' | 'creative';

@Component({
  selector: 'lba-cover-letter-tone-picker',
  standalone: true,
  imports: [],
  templateUrl: './cover-letter-tone-picker.html',
  styleUrl: './cover-letter-tone-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoverLetterTonePicker {
  readonly tone = input.required<CoverLetterTone>();
  readonly toneChange = output<CoverLetterTone>();

  readonly options: Array<{
    value: CoverLetterTone;
    label: string;
    kicker: string;
    description: string;
    example: string;
  }> = [
    {
      value: 'formal',
      label: 'Formell',
      kicker: 'Souverän',
      description: 'Klassisch-professionell für Konzerne, Behörden und traditionelle Branchen.',
      example: 'Hiermit bewerbe ich mich auf die ausgeschriebene Stelle als …',
    },
    {
      value: 'modern',
      label: 'Modern',
      kicker: 'Direkt',
      description: 'Klar, persönlich und auf den Punkt für Tech, Scale-ups und moderne Teams.',
      example: 'Ich bringe vier Jahre Angular-Erfahrung mit und sehe genau hier meinen Beitrag.',
    },
    {
      value: 'creative',
      label: 'Kreativ',
      kicker: 'Mutig',
      description: 'Prägnant und eigenständig für Agenturen, Startups und kreative Rollen.',
      example: 'Gute Interfaces entstehen aus Neugier, Sorgfalt und sauberem Handwerk.',
    },
  ];
}
