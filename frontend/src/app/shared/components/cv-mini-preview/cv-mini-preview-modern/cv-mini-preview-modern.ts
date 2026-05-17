import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export interface MiniCvData {
  name?: string;
  summary?: string;
  skills?: string[];
}

@Component({
  selector: 'lba-cv-mini-preview-modern',
  standalone: true,
  imports: [],
  templateUrl: './cv-mini-preview-modern.html',
  styleUrl: './cv-mini-preview-modern.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvMiniPreviewModern {
  readonly cv = input<MiniCvData | null>(null);
}
