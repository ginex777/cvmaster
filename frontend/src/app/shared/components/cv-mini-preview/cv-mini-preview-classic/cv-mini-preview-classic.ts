import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MiniCvData } from '../cv-mini-preview-modern/cv-mini-preview-modern';

@Component({
  selector: 'lba-cv-mini-preview-classic',
  standalone: true,
  imports: [],
  templateUrl: './cv-mini-preview-classic.html',
  styleUrl: './cv-mini-preview-classic.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvMiniPreviewClassic {
  readonly cv = input<MiniCvData | null>(null);
}
