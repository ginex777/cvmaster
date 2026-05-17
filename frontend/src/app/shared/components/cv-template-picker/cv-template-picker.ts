import { ChangeDetectionStrategy, Component, HostListener, input, output, signal } from '@angular/core';
import { IconsModule } from '../../icons/icons.module';
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
    IconsModule,
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

  readonly dropdownOpen = signal(false);

  readonly options: Array<{ value: CvTemplate; label: string }> = [
    { value: 'classic',   label: 'Klassisch' },
    { value: 'modern',    label: 'Modern' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'minimal',   label: 'Minimal' },
    { value: 'executive', label: 'Executive' },
  ];

  get currentLabel(): string {
    return this.options.find(o => o.value === this.template())?.label ?? '';
  }

  toggleDropdown(): void {
    this.dropdownOpen.update(v => !v);
  }

  select(value: CvTemplate): void {
    this.templateChange.emit(value);
    this.dropdownOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.dropdownOpen.set(false);
  }
}
