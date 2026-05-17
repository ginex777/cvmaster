import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MiniCvData } from '../cv-mini-preview-modern/cv-mini-preview-modern';

@Component({
  selector: 'lba-cv-mini-preview-editorial',
  standalone: true,
  imports: [],
  templateUrl: './cv-mini-preview-editorial.html',
  styleUrl: './cv-mini-preview-editorial.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvMiniPreviewEditorial {
  readonly cv = input<MiniCvData | null>(null);
}
