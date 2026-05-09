import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface WizardForm {
  name: string;
  currentRoleOrStudium: string;
  topSkills: string;
  language: 'de' | 'en';
  targetRole: string;
}

@Component({
  selector: 'lba-wizard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './wizard.component.html',
  styleUrl: './wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardComponent {
  private http   = inject(HttpClient);
  private router = inject(Router);

  form: WizardForm = {
    name: '', currentRoleOrStudium: '', topSkills: '', language: 'de', targetRole: '',
  };
  loading = signal(false);
  error   = signal('');

  async submit() {
    this.loading.set(true);
    this.error.set('');
    try {
      await firstValueFrom(this.http.post('/api/cvs/wizard', {
        ...this.form,
        topSkills: this.form.topSkills.split(',').map(s => s.trim()).filter(Boolean),
      }));
      await this.router.navigate(['/app/cvs']);
    } catch (e: unknown) {
      const msg = (e as { error?: { message?: string } })?.error?.message;
      this.error.set(msg ?? 'Fehler beim Erstellen des CVs.');
    } finally {
      this.loading.set(false);
    }
  }
}
