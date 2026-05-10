import type { OnInit } from '@angular/core';
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
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
  imports: [DatePipe, CvTemplatePicker],
  templateUrl: './master-cvs.component.html',
  styleUrl: './master-cvs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterCvsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly cvs = signal<MasterCv[]>([]);
  readonly loading = signal(false);
  readonly uploading = signal(false);
  readonly error = signal<string | null>(null);

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

  async remove(id: string): Promise<void> {
    this.error.set(null);
    try {
      await this.api.delete<void>(`/cvs/${id}`);
      this.cvs.update((list) => list.filter((cv) => cv.id !== id));
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Löschen fehlgeschlagen.',
      );
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
}
