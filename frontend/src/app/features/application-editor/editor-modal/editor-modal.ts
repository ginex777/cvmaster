import { DOCUMENT } from '@angular/common';
import type { OnDestroy } from '@angular/core';
import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, input, output } from '@angular/core';
import { IconsModule } from '../../../shared/icons/icons.module';
import { EditorComponent } from '../editor.component';

@Component({
  selector: 'lba-editor-modal',
  imports: [EditorComponent, IconsModule],
  templateUrl: './editor-modal.html',
  styleUrl: './editor-modal.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditorModalComponent implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private previousUrl: string | null = null;
  private syncedAppId: string | null = null;

  readonly appId = input<string | null>(null);
  readonly closed = output<void>();

  private readonly keydownHandler = (event: KeyboardEvent) => {
    if (!this.appId()) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (event.key === 'Tab') {
      this.trapFocus(event);
    }
  };

  constructor() {
    this.document.addEventListener('keydown', this.keydownHandler);

    effect(() => {
      const id = this.appId();
      if (id) {
        this.syncUrl(id);
        queueMicrotask(() => this.focusDialog());
      } else if (this.syncedAppId) {
        this.restoreUrl();
      }
    });
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('keydown', this.keydownHandler);
    this.restoreUrl();
  }

  close(): void {
    this.restoreUrl();
    this.closed.emit();
  }

  private syncUrl(id: string): void {
    const view = this.document.defaultView;
    if (!view || this.syncedAppId === id) return;

    const currentUrl = `${view.location.pathname}${view.location.search}${view.location.hash}`;
    const nextUrl = `/app/applications/${encodeURIComponent(id)}`;
    if (currentUrl === nextUrl) {
      this.syncedAppId = id;
      return;
    }

    if (this.previousUrl === null) {
      this.previousUrl = currentUrl;
    }
    view.history.pushState({ editorModal: true, id }, '', nextUrl);
    this.syncedAppId = id;
  }

  private restoreUrl(): void {
    const view = this.document.defaultView;
    if (!view || this.previousUrl === null) {
      this.syncedAppId = null;
      return;
    }

    view.history.replaceState(null, '', this.previousUrl);
    this.previousUrl = null;
    this.syncedAppId = null;
  }

  private focusDialog(): void {
    const dialog = this.dialogElement();
    if (!dialog || dialog.contains(this.document.activeElement)) return;
    dialog.focus();
  }

  private trapFocus(event: KeyboardEvent): void {
    const dialog = this.dialogElement();
    if (!dialog) return;

    const focusable = this.focusableElements(dialog);
    if (focusable.length === 0) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = this.document.activeElement;

    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  private dialogElement(): HTMLElement | null {
    return this.host.nativeElement.querySelector<HTMLElement>('.modal-panel');
  }

  private focusableElements(dialog: HTMLElement): HTMLElement[] {
    return Array.from(dialog.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter(element => !element.hasAttribute('aria-hidden'));
  }
}
