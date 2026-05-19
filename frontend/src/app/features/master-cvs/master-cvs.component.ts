import type { OnInit } from '@angular/core';
import { ChangeDetectionStrategy, Component, HostListener, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { ConfirmDeleteModal } from '../../shared/components/confirm-delete-modal/confirm-delete-modal';
import { CvMiniPreviewClassic } from '../../shared/components/cv-mini-preview/cv-mini-preview-classic/cv-mini-preview-classic';
import { CvMiniPreviewEditorial } from '../../shared/components/cv-mini-preview/cv-mini-preview-editorial/cv-mini-preview-editorial';
import { CvMiniPreviewExecutive } from '../../shared/components/cv-mini-preview/cv-mini-preview-executive/cv-mini-preview-executive';
import { CvMiniPreviewMinimal } from '../../shared/components/cv-mini-preview/cv-mini-preview-minimal/cv-mini-preview-minimal';
import { CvMiniPreviewModern } from '../../shared/components/cv-mini-preview/cv-mini-preview-modern/cv-mini-preview-modern';
import { CvSectionEditorComponent, type CvSection } from '../../shared/components/cv-section-editor/cv-section-editor.component';
import { CvTemplatePicker, type CvTemplate } from '../../shared/components/cv-template-picker/cv-template-picker';
import { IconsModule } from '../../shared/icons/icons.module';
import type { MasterCv } from '../../shared/models/cv.model';

type CvLanguage = 'de' | 'en';

@Component({
  selector: 'lba-master-cvs',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    ConfirmDeleteModal,
    CvTemplatePicker,
    CvMiniPreviewClassic,
    CvMiniPreviewEditorial,
    CvMiniPreviewExecutive,
    CvMiniPreviewMinimal,
    CvMiniPreviewModern,
    CvSectionEditorComponent,
    IconsModule,
  ],
  templateUrl: './master-cvs.component.html',
  styleUrl: './master-cvs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterCvsComponent implements OnInit {
  private static readonly PRIMARY_STORAGE_KEY = 'hireflow.primaryMasterCvId';

  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  readonly cvs = signal<MasterCv[]>([]);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly savingTextCv = signal(false);
  readonly textFormOpen = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly renamingId = signal<string | null>(null);
  readonly renameValue = signal('');
  readonly primaryCvId = signal<string | null>(this.loadPrimaryCvId());
  readonly moreMenuId = signal<string | null>(null);
  readonly editingCv = signal<MasterCv | null>(null);
  readonly editingSections = signal<CvSection[]>([]);
  readonly sortedCvs = computed(() =>
    [...this.cvs()].sort((a, b) => Number(!!b.isPrimary) - Number(!!a.isPrimary)),
  );

  readonly textCvForm = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2), Validators.maxLength(120)],
    }),
    language: new FormControl<CvLanguage>('de', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    text: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(40), Validators.maxLength(50_000)],
    }),
  });

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.setCvs(await this.api.get<MasterCv[]>('/cvs'));
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Lebensläufe konnten nicht geladen werden.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (this.moreMenuId() && target instanceof Element && !target.closest('.cv-card__more-menu')) {
      this.moreMenuId.set(null);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.moreMenuId()) {
      this.moreMenuId.set(null);
      return;
    }

    if (this.editingCv()) {
      this.closeEditor();
    }
  }

  async upload(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.uploading.set(true);
    this.error.set(null);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('name', file.name.replace(/\.[^.]+$/, ''));
      const cv = await this.api.upload<MasterCv>('/cvs', form);
      this.setCvs([cv, ...this.cvs()]);
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Upload fehlgeschlagen.',
      );
    } finally {
      this.uploading.set(false);
      (event.target as HTMLInputElement).value = '';
    }
  }

  toggleTextForm(): void {
    this.textFormOpen.update(open => !open);
  }

  closeTextForm(): void {
    this.textFormOpen.set(false);
    this.textCvForm.reset({ name: '', language: 'de', text: '' });
  }

  async createFromText(): Promise<void> {
    if (this.textCvForm.invalid) {
      this.textCvForm.markAllAsTouched();
      return;
    }

    this.savingTextCv.set(true);
    this.error.set(null);
    try {
      const cv = await this.api.post<MasterCv>('/cvs/text', this.textCvForm.getRawValue());
      this.setCvs([cv, ...this.cvs().filter((item) => item.id !== cv.id)]);
      this.closeTextForm();
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Text-Lebenslauf konnte nicht gespeichert werden.',
      );
    } finally {
      this.savingTextCv.set(false);
    }
  }

  requestDelete(id: string): void {
    this.moreMenuId.set(null);
    this.deletingId.set(id);
  }

  async confirmDelete(): Promise<void> {
    const id = this.deletingId();
    if (!id) return;

    this.error.set(null);
    try {
      await this.api.delete<void>(`/cvs/${id}`);
      this.setCvs(this.cvs().filter((cv) => cv.id !== id));
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Löschen fehlgeschlagen.',
      );
    } finally {
      this.deletingId.set(null);
    }
  }

  async updateTemplate(id: string, template: CvTemplate): Promise<void> {
    const previous = this.cvs().find((cv) => cv.id === id)?.template ?? 'modern';
    this.error.set(null);
    this.cvs.update((list) => list.map((cv) => cv.id === id ? { ...cv, template } : cv));

    try {
      await this.api.patch<MasterCv>(`/cvs/${id}`, { template });
    } catch {
      this.cvs.update((list) => list.map((cv) => cv.id === id ? { ...cv, template: previous } : cv));
      this.error.set('Template konnte nicht gespeichert werden.');
    }
  }

  sourceLabel(cv: MasterCv): string {
    if (cv.sourceFilename === 'text-input') return 'Text-Eingabe';
    return cv.sourceFilename;
  }

  cvAccentColor(cv: MasterCv): string {
    return {
      modern: 'var(--accent)',
      classic: 'var(--status-offer)',
      editorial: 'var(--status-interview)',
      executive: 'var(--status-applied)',
      minimal: 'var(--ink-3)',
    }[cv.template] ?? 'var(--accent)';
  }

  cvAccentBg(cv: MasterCv): string {
    return {
      modern: 'oklch(96% 0.025 268)',
      classic: 'oklch(96% 0.030 155)',
      editorial: 'oklch(96% 0.025 295)',
      executive: 'oklch(96% 0.025 240)',
      minimal: 'var(--surface-2)',
    }[cv.template] ?? 'oklch(96% 0.025 268)';
  }

  useInWizard(id: string): void {
    void this.router.navigate(['/app/wizard'], { queryParams: { cvId: id } });
  }

  editCv(cv: MasterCv): void {
    this.moreMenuId.set(null);
    this.editingCv.set(cv);
    this.editingSections.set(this.sectionsForCv(cv));
  }

  closeEditor(): void {
    this.editingCv.set(null);
    this.editingSections.set([]);
  }

  onEditingSectionsChange(sections: CvSection[]): void {
    this.editingSections.set(sections);
  }

  startRename(cv: MasterCv): void {
    this.moreMenuId.set(null);
    this.renamingId.set(cv.id);
    this.renameValue.set(cv.name);
  }

  async saveRename(cv: MasterCv): Promise<void> {
    const name = this.renameValue().trim();
    if (!name || name === cv.name) {
      this.renamingId.set(null);
      return;
    }

    this.error.set(null);
    try {
      await this.api.patch<MasterCv>(`/cvs/${cv.id}`, { name });
      this.cvs.update((list) => list.map((item) => item.id === cv.id ? { ...item, name } : item));
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Umbenennen fehlgeschlagen.',
      );
    } finally {
      this.renamingId.set(null);
    }
  }

  toggleMoreMenu(cvId: string): void {
    this.moreMenuId.update((openId) => openId === cvId ? null : cvId);
  }

  setPrimary(cv: MasterCv): void {
    this.moreMenuId.set(null);
    this.setCvs(this.cvs(), cv.id);
  }

  private setCvs(list: MasterCv[], preferredPrimaryId = this.primaryCvId()): void {
    const normalized = this.withPrimary(list, preferredPrimaryId);
    this.cvs.set(normalized);
    const primaryId = normalized.find((cv) => cv.isPrimary)?.id ?? null;
    this.primaryCvId.set(primaryId);
    this.persistPrimaryCvId(primaryId);
  }

  private withPrimary(list: MasterCv[], preferredPrimaryId: string | null): MasterCv[] {
    const fallbackId = list.find((cv) => cv.isPrimary)?.id ?? list[0]?.id ?? null;
    const primaryId = preferredPrimaryId && list.some((cv) => cv.id === preferredPrimaryId)
      ? preferredPrimaryId
      : fallbackId;

    return list.map((cv) => ({ ...cv, isPrimary: cv.id === primaryId }));
  }

  private sectionsForCv(cv: MasterCv): CvSection[] {
    const language = cv.language.toUpperCase();
    return [
      {
        id: `${cv.id}-profile`,
        heading: 'Profil',
        bullets: [
          {
            id: `${cv.id}-profile-summary`,
            text: `${cv.name} (${language})`,
          },
        ],
      },
      {
        id: `${cv.id}-experience`,
        heading: 'Erfahrung',
        bullets: [
          {
            id: `${cv.id}-source`,
            text: `Quelle: ${this.sourceLabel(cv)} · Template: ${cv.template}`,
          },
        ],
      },
    ];
  }

  private loadPrimaryCvId(): string | null {
    if (!isPlatformBrowser(this.platformId)) return null;
    try {
      return localStorage.getItem(MasterCvsComponent.PRIMARY_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  private persistPrimaryCvId(id: string | null): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      if (id) {
        localStorage.setItem(MasterCvsComponent.PRIMARY_STORAGE_KEY, id);
      } else {
        localStorage.removeItem(MasterCvsComponent.PRIMARY_STORAGE_KEY);
      }
    } catch {
      // The in-memory primary state still works when browser storage is unavailable.
    }
  }
}
