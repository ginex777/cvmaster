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

interface PaletteItem {
  label: string;
  description?: string;
  icon: string;
  action: () => void;
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

  readonly query = signal('');
  readonly isOpen = signal(false);

  private readonly allItems: PaletteItem[] = [
    { label: 'Neue Bewerbung erstellen', icon: 'plus', action: () => void this.router.navigate(['/app/wizard']) },
    { label: 'Lebenslauf hochladen', icon: 'upload', action: () => void this.router.navigate(['/app/cvs']) },
    { label: 'Pipeline öffnen', icon: 'kanban', action: () => void this.router.navigate(['/app/pipeline']) },
    { label: 'Bewerbungen', icon: 'briefcase', action: () => void this.router.navigate(['/app/applications']) },
    { label: 'Lebensläufe', icon: 'file-text', action: () => void this.router.navigate(['/app/cvs']) },
    { label: 'Einstellungen', icon: 'settings', action: () => void this.router.navigate(['/app/settings']) },
    { label: 'Dashboard', icon: 'home', action: () => void this.router.navigate(['/app']) },
  ];

  readonly filteredItems = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.allItems;
    return this.allItems.filter(item =>
      item.label.toLowerCase().includes(q) || item.description?.toLowerCase().includes(q)
    );
  });

  open(): void {
    this.query.set('');
    this.isOpen.set(true);
    this.dialogRef?.nativeElement.showModal();
  }

  close(): void {
    this.isOpen.set(false);
    this.dialogRef?.nativeElement.close();
  }

  select(item: PaletteItem): void {
    item.action();
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
        this.open();
      }
    }
    if (event.key === 'Escape' && this.isOpen()) {
      this.close();
    }
  }

}
