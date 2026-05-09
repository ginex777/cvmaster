import type { OnInit} from '@angular/core';
import { Component, ChangeDetectionStrategy, signal, inject, input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

export interface Bullet  { id: string; text: string; suggested?: string; accepted?: boolean; }
export interface CvSection { id: string; company: string; role: string; bullets: Bullet[]; }

@Component({
  selector: 'lba-editor',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorComponent implements OnInit {
  id = input.required<string>();
  private http = inject(HttpClient);

  loading      = signal(true);
  exporting    = signal(false);
  matchScore   = signal<number | null>(null);
  sections     = signal<CvSection[]>([]);
  coverLetter  = signal<Record<string, string>>({});
  chosenVariant = signal<'concise' | 'warm' | 'formal'>('warm');
  chosenLayout  = signal<'modern' | 'clean' | 'editorial'>('modern');

  async ngOnInit() {
    const app = await firstValueFrom(
      this.http.get<{ matchScore: number | null; optimizedCv?: { experience: CvSection[] }; coverLetter?: Record<string, string> }>(
        `/api/applications/${this.id()}`
      )
    );
    this.matchScore.set(app.matchScore);
    this.sections.set(app.optimizedCv?.experience ?? []);
    this.coverLetter.set(app.coverLetter ?? {});
    this.loading.set(false);
  }

  accept(bullet: Bullet) { bullet.text = bullet.suggested ?? ''; bullet.accepted = true; }
  reject(bullet: Bullet) { bullet.suggested = undefined; }

  async exportPdf() {
    this.exporting.set(true);
    try {
      const blob = await firstValueFrom(
        this.http.post(
          `/api/applications/${this.id()}/export`,
          { layout: this.chosenLayout() },
          { responseType: 'blob' },
        )
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'bewerbung.zip'; a.click();
      URL.revokeObjectURL(url);
    } finally {
      this.exporting.set(false);
    }
  }

  async emailToSelf() {
    await firstValueFrom(this.http.post(`/api/applications/${this.id()}/email-to-self`, {}));
  }
}
