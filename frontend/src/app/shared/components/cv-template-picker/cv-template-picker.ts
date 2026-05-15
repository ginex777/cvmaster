import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CvMiniPreviewClassic } from '../cv-mini-preview/cv-mini-preview-classic/cv-mini-preview-classic';
import { CvMiniPreviewEditorial } from '../cv-mini-preview/cv-mini-preview-editorial/cv-mini-preview-editorial';
import { CvMiniPreviewExecutive } from '../cv-mini-preview/cv-mini-preview-executive/cv-mini-preview-executive';
import { CvMiniPreviewMinimal } from '../cv-mini-preview/cv-mini-preview-minimal/cv-mini-preview-minimal';
import { CvMiniPreviewModern } from '../cv-mini-preview/cv-mini-preview-modern/cv-mini-preview-modern';

export type CvTemplate = 'classic' | 'modern' | 'editorial' | 'minimal' | 'executive';

@Component({
  selector: 'lba-cv-template-picker',
  standalone: true,
  imports: [
    CvMiniPreviewClassic,
    CvMiniPreviewModern,
    CvMiniPreviewEditorial,
    CvMiniPreviewMinimal,
    CvMiniPreviewExecutive,
  ],
  templateUrl: './cv-template-picker.html',
  styleUrl: './cv-template-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvTemplatePicker {
  readonly template = input.required<CvTemplate>();
  readonly templateChange = output<CvTemplate>();

  readonly options: Array<{ value: CvTemplate; label: string; description: string }> = [
    { value: 'classic', label: 'Klassisch', description: 'Einspaltig und serioes' },
    { value: 'modern', label: 'Modern', description: 'Sidebar mit klarer Struktur' },
    { value: 'editorial', label: 'Editorial', description: 'Praesent und gestalterisch' },
    { value: 'minimal', label: 'Minimal', description: 'Ruhig mit viel Weissraum' },
    { value: 'executive', label: 'Executive', description: 'Senior Look mit Kopfbereich' },
  ];
}
