import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';

export interface CvBullet {
  id: string;
  text: string;
  originalText?: string;
  accepted?: boolean;
}

export interface CvSection {
  id: string;
  heading: string;
  bullets: CvBullet[];
}

@Component({
  selector: 'lba-cv-section-editor',
  standalone: true,
  imports: [],
  templateUrl: './cv-section-editor.component.html',
  styleUrl: './cv-section-editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CvSectionEditorComponent {
  readonly sections = input.required<CvSection[]>();
  readonly saving = input<boolean>(false);
  readonly sectionsChange = output<CvSection[]>();

  readonly local = signal<CvSection[]>([]);

  constructor() {
    effect(() => {
      const incoming = this.sections();
      const incomingIds = incoming.map(s => s.id).join(',');
      const localIds = this.local().map(s => s.id).join(',');
      if (incomingIds !== localIds) {
        this.local.set(incoming.map(s => ({ ...s, bullets: s.bullets.map(b => ({ ...b })) })));
      }
    });
  }

  onHeadingInput(si: number, heading: string): void {
    this.local.update(ss => ss.map((s, i) => i === si ? { ...s, heading } : s));
  }

  onBulletInput(si: number, bi: number, text: string): void {
    this.local.update(ss => ss.map((s, i) =>
      i === si ? { ...s, bullets: s.bullets.map((b, j) => j === bi ? { ...b, text } : b) } : s,
    ));
  }

  acceptBullet(si: number, bi: number): void {
    this.local.update(ss => ss.map((s, i) =>
      i === si ? { ...s, bullets: s.bullets.map((b, j) => j === bi ? { ...b, accepted: true, originalText: undefined } : b) } : s,
    ));
    this.emitSave();
  }

  rejectBullet(si: number, bi: number): void {
    this.local.update(ss => ss.map((s, i) => i !== si ? s : {
      ...s,
      bullets: s.bullets.map((b, j) => j !== bi ? b : { ...b, text: b.originalText ?? b.text, originalText: undefined }),
    }));
    this.emitSave();
  }

  addBullet(si: number): void {
    this.local.update(ss => ss.map((s, i) =>
      i === si ? { ...s, bullets: [...s.bullets, { id: crypto.randomUUID(), text: '' }] } : s,
    ));
    this.emitSave();
  }

  removeBullet(si: number, bi: number): void {
    this.local.update(ss => ss.map((s, i) =>
      i === si ? { ...s, bullets: s.bullets.filter((_, j) => j !== bi) } : s,
    ));
    this.emitSave();
  }

  addSection(): void {
    this.local.update(ss => [...ss, { id: crypto.randomUUID(), heading: 'Neuer Abschnitt', bullets: [] }]);
    this.emitSave();
  }

  removeSection(si: number): void {
    this.local.update(ss => ss.filter((_, i) => i !== si));
    this.emitSave();
  }

  emitSave(): void {
    this.sectionsChange.emit(this.local());
  }
}
