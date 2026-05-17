import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  ViewChild,
  computed,
  inject,
  signal,
  type ElementRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { IconsModule } from '../../icons/icons.module';
import { ApiService } from '../../../core/api/api.service';

interface PaletteItem {
  label: string;
  description?: string;
  icon: string;
  action: () => void;
}

interface AppResult {
  id: string;
  company: string;
  role: string;
}

interface CvResult {
  id: string;
  name: string;
}

@Component({
  selector: 'lba-command-palette',
  standalone: true,
  imports: [IconsModule],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent {
  @ViewChild('dialog') private dialogRef!: ElementRef<HTMLDialogElement>;

  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

  readonly query = signal('');
  readonly isOpen = signal(false);
  readonly applications = signal<AppResult[]>([]);
  readonly cvs = signal<CvResult[]>([]);

  private readonly staticItems: PaletteItem[] = [
    { label: 'Neue Bewerbung erstellen', icon: 'plus', action: () => void this.router.navigate(['/app/wizard']) },
    { label: 'Lebenslauf hochladen', icon: 'upload', action: () => void this.router.navigate(['/app/cvs']) },
    { label: 'Pipeline öffnen', icon: 'kanban', action: () => void this.router.navigate(['/app/pipeline']) },
    { label: 'Bewerbungen', icon: 'briefcase', action: () => void this.router.navigate(['/app/applications']) },
    { label: 'Lebensläufe', icon: 'file-text', action: () => void this.router.navigate(['/app/cvs']) },
    { label: 'Einstellungen', icon: 'settings', action: () => void this.router.navigate(['/app/settings']) },
    { label: 'Dashboard', icon: 'home', action: () => void this.router.navigate(['/app']) },
  ];

  readonly filteredStatic = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.staticItems;
    return this.staticItems.filter(item =>
      item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
    );
  });

  readonly filteredApplications = computed(() => {
    const q = this.query().trim().toLowerCase();
    const apps = this.applications();
    if (!q) return apps.slice(0, 5);
    return apps.filter(a =>
      `${a.company} ${a.role}`.toLowerCase().includes(q)
    ).slice(0, 5);
  });

  readonly filteredCvs = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cvs = this.cvs();
    if (!q) return cvs.slice(0, 5);
    return cvs.filter(c => c.name.toLowerCase().includes(q)).slice(0, 5);
  });

  readonly hasResults = computed(() =>
    this.filteredStatic().length > 0 ||
    this.filteredApplications().length > 0 ||
    this.filteredCvs().length > 0
  );

  async open(): Promise<void> {
    this.query.set('');
    this.isOpen.set(true);
    this.dialogRef?.nativeElement.showModal();
    await this.loadData();
  }

  close(): void {
    this.isOpen.set(false);
    this.dialogRef?.nativeElement.close();
  }

  select(item: PaletteItem): void {
    item.action();
    this.close();
  }

  openApplication(id: string): void {
    void this.router.navigate(['/app/applications', id]);
    this.close();
  }

  openCv(id: string): void {
    void this.router.navigate(['/app/cvs'], { queryParams: { highlight: id } });
    this.close();
  }

  onDialogClick(event: MouseEvent): void {
    if (event.target === this.dialogRef.nativeElement) {
      this.close();
    }
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      if (this.isOpen()) {
        this.close();
      } else {
        void this.open();
      }
    }
    if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

  private async loadData(): Promise<void> {
    try {
      const [apps, cvs] = await Promise.all([
        this.api.get<AppResult[]>('/applications').catch(() => [] as AppResult[]),
        this.api.get<CvResult[]>('/cvs').catch(() => [] as CvResult[]),
      ]);
      this.applications.set(apps);
      this.cvs.set(cvs);
    } catch {
      // silently ignore — static items remain available
    }
  }
}
