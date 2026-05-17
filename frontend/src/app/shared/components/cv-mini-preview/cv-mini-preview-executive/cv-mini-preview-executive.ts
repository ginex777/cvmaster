import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { MiniCvData } from '../cv-mini-preview-modern/cv-mini-preview-modern';

@Component({
  selector: 'lba-cv-mini-preview-executive',
  standalone: true,
  imports: [],
  templateUrl: './cv-mini-preview-executive.html',
  styleUrl: './cv-mini-preview-executive.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvMiniPreviewExecutive {
  readonly cv = input<MiniCvData | null>(null);
}
