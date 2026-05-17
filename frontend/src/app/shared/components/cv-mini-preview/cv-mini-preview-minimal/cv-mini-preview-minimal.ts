import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MiniCvData } from '../cv-mini-preview-modern/cv-mini-preview-modern';

@Component({
  selector: 'lba-cv-mini-preview-minimal',
  standalone: true,
  imports: [],
  templateUrl: './cv-mini-preview-minimal.html',
  styleUrl: './cv-mini-preview-minimal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvMiniPreviewMinimal {
  readonly cv = input<MiniCvData | null>(null);
}
