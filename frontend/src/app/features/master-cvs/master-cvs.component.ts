import type { OnInit } from '@angular/core';
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { ApiService } from '../../core/api/api.service';
import { ConfirmDeleteModal } from '../../shared/components/confirm-delete-modal/confirm-delete-modal';
import { CvTemplatePicker, type CvTemplate } from '../../shared/components/cv-template-picker/cv-template-picker';

export interface MasterCv {
  id: string;
  name: string;
  language: string;
  sourceFilename: string;
  template: CvTemplate;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'lba-master-cvs',
  standalone: true,
  imports: [DatePipe, ConfirmDeleteModal, CvTemplatePicker],
  templateUrl: './master-cvs.component.html',
  styleUrl: './master-cvs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterCvsComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly cvs = signal<MasterCv[]>([]);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly renamingId = signal<string | null>(null);
  readonly renameValue = signal('');

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.cvs.set(await this.api.get<MasterCv[]>('/cvs'));
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Lebensläufe konnten nicht geladen werden.',
      );
    } finally {
      this.loading.set(false);
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
      this.cvs.update((list) => [cv, ...list]);
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Upload fehlgeschlagen.',
      );
    } finally {
      this.uploading.set(false);
      (event.target as HTMLInputElement).value = '';
    }
  }

  requestDelete(id: string): void {
    this.deletingId.set(id);
  }

  async confirmDelete(): Promise<void> {
    const id = this.deletingId();
    if (!id) return;

    this.error.set(null);
    try {
      await this.api.delete<void>(`/cvs/${id}`);
      this.cvs.update((list) => list.filter((cv) => cv.id !== id));
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

  useInWizard(id: string): void {
    void this.router.navigate(['/app/wizard'], { queryParams: { cvId: id } });
  }

  startRename(cv: MasterCv): void {
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
}
