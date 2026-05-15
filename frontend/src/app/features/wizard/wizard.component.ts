import type { OnInit } from '@angular/core';
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiService } from '../../core/api/api.service';
import { CoverLetterTonePicker } from '../../shared/components/cover-letter-tone-picker/cover-letter-tone-picker';
import type { CoverLetterTone } from '../../shared/components/cover-letter-tone-picker/cover-letter-tone-picker';
import { UpgradeModal } from '../../shared/components/upgrade-modal/upgrade-modal';

type JobInputMode = 'text' | 'url' | 'pdf' | 'screenshot';

export interface MasterCv {
  id: string;
  name: string;
  language: string;
  sourceFilename: string;
  parsedJson?: {
    summary?: string;
    skills?: string[];
  };
  template?: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'lba-wizard',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, UpgradeModal, CoverLetterTonePicker],
  templateUrl: './wizard.component.html',
  styleUrl: './wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WizardComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly step = signal(1);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly cvs = signal<MasterCv[]>([]);
  readonly selectedCvId = signal<string | null>(null);
  readonly quickstartPreview = signal<MasterCv | null>(null);
  readonly upgradeModalOpen = signal(false);
  readonly jobInputMode = signal<JobInputMode>('text');
  readonly selectedTone = signal<CoverLetterTone>('formal');

  readonly quickstartForm = new FormGroup({
    name: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]),
    currentRoleOrStudy: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(160)]),
    topSkills: new FormControl('', [Validators.required]),
    language: new FormControl<'de' | 'en'>('de', { nonNullable: true, validators: [Validators.required] }),
    targetRole: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]),
  });

  readonly jobForm = new FormGroup({
    jobRaw: new FormControl('', [Validators.required, Validators.minLength(50)]),
    jobUrl: new FormControl('', [Validators.maxLength(2048)]),
  });

  async ngOnInit(): Promise<void> {
    try {
      const cvs = await this.api.get<MasterCv[]>('/cvs');
      this.cvs.set(cvs);

      const cvId = this.route.snapshot.queryParamMap.get('cvId');
      if (cvId && cvs.some((cv) => cv.id === cvId)) {
        this.selectCv(cvId);
      }
    } catch {
      this.error.set('Lebensläufe konnten nicht geladen werden.');
    }
  }

  selectCv(id: string): void {
    this.selectedCvId.set(id);
    this.quickstartPreview.set(this.cvs().find(cv => cv.id === id && cv.sourceFilename === 'quickstart') ?? null);
    this.step.set(2);
  }

  async createQuickstartCv(): Promise<void> {
    if (this.quickstartForm.invalid || this.skillList().length < 3 || this.skillList().length > 5) {
      this.quickstartForm.markAllAsTouched();
      this.error.set('Bitte gib 3 bis 5 Skills und alle Pflichtfelder ein.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const cv = await this.api.post<MasterCv>('/cvs/quickstart', {
        name: this.quickstartForm.controls.name.value ?? '',
        currentRoleOrStudy: this.quickstartForm.controls.currentRoleOrStudy.value ?? '',
        topSkills: this.skillList(),
        language: this.quickstartForm.controls.language.value,
        targetRole: this.quickstartForm.controls.targetRole.value ?? '',
      });
      this.cvs.update(current => [cv, ...current.filter(item => item.id !== cv.id)]);
      this.selectedCvId.set(cv.id);
      this.quickstartPreview.set(cv);
    } catch (e: unknown) {
      this.error.set(
        e instanceof HttpErrorResponse ? e.error.message : 'Quickstart-Lebenslauf konnte nicht erstellt werden.',
      );
    } finally {
      this.loading.set(false);
    }
  }

  selectJobInputMode(mode: JobInputMode): void {
    if (mode === 'pdf' || mode === 'screenshot') {
      this.error.set('PDF und Screenshot folgen nach der RAM-only Sicherheitsfreigabe. Nutze bitte Text oder URL.');
      return;
    }

    this.jobInputMode.set(mode);
    this.error.set(null);
  }

  nextStep(): void {
    if (this.currentJobInputValid()) {
      this.error.set(null);
      this.step.set(3);
      return;
    }

    this.jobForm.markAllAsTouched();
    this.error.set(this.jobInputMode() === 'url'
      ? 'Bitte gib eine gueltige URL zur Stellenanzeige ein.'
      : 'Bitte fuege mindestens 50 Zeichen Stellentext ein.');
  }

  async generate(): Promise<void> {
    if (!this.selectedCvId()) {
      this.error.set('Bitte waehle oder erstelle zuerst einen Lebenslauf.');
      this.step.set(1);
      return;
    }

    if (!this.currentJobInputValid()) {
      this.error.set(this.jobInputMode() === 'url'
        ? 'Bitte gib eine gueltige URL zur Stellenanzeige ein.'
        : 'Bitte fuege mindestens 50 Zeichen Stellentext ein.');
      this.step.set(2);
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    try {
      const job = await this.api.post<{ id: string }>('/jobs/parse', {
        type: this.jobInputMode(),
        value: this.currentJobInputValue(),
      });
      const app = await this.api.post<{ id: string }>('/applications', {
        masterCvId: this.selectedCvId(),
        jobPostingId: job.id,
      });
      await this.persistTonePreference(app.id);
      await this.router.navigate(['/app/applications', app.id]);
    } catch (e: unknown) {
      if (e instanceof HttpErrorResponse && e.status === 402) {
        this.upgradeModalOpen.set(true);
      } else {
        this.error.set(
          e instanceof HttpErrorResponse ? e.error.message : 'Bewerbung konnte nicht erstellt werden.',
        );
      }
    } finally {
      this.loading.set(false);
    }
  }

  onUpgradeRequested(): void {
    this.upgradeModalOpen.set(false);
    void this.router.navigate(['/app/billing']);
  }

  onToneChange(tone: CoverLetterTone): void {
    this.selectedTone.set(tone);
  }

  skillList(): string[] {
    return (this.quickstartForm.controls.topSkills.value ?? '')
      .split(',')
      .map(skill => skill.trim())
      .filter(Boolean)
      .slice(0, 6);
  }

  currentJobInputValid(): boolean {
    if (this.jobInputMode() === 'url') {
      const value = this.currentJobInputValue();
      try {
        const url = new URL(value);
        return (url.protocol === 'https:' || url.protocol === 'http:') && value.length <= 2048;
      } catch {
        return false;
      }
    }

    if (this.jobInputMode() !== 'text') return false;

    return this.currentJobInputValue().length >= 50;
  }

  currentJobInputValue(): string {
    return this.jobInputMode() === 'url'
      ? (this.jobForm.controls.jobUrl.value ?? '').trim()
      : (this.jobForm.controls.jobRaw.value ?? '').trim();
  }

  private async persistTonePreference(applicationId: string): Promise<void> {
    try {
      await this.api.patch(`/applications/${applicationId}/tone`, { tone: this.selectedTone() });
    } catch {
      // The generated formal letter remains a usable fallback if the preference write fails.
    }
  }
}
