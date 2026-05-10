import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type CvTemplate = 'classic' | 'modern' | 'editorial';

@Component({
  selector: 'lba-cv-template-picker',
  templateUrl: './cv-template-picker.html',
  styleUrl: './cv-template-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvTemplatePicker {
  readonly template = input.required<CvTemplate>();
  readonly templateChange = output<CvTemplate>();

  readonly options: Array<{ value: CvTemplate; label: string }> = [
    { value: 'classic', label: 'Classic' },
    { value: 'modern', label: 'Modern' },
    { value: 'editorial', label: 'Creative' },
  ];
}
