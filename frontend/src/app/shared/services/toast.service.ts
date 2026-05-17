import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  private nextId = 0;

  success(message: string): void {
    this.add('success', message, 4000);
  }

  error(message: string): void {
    this.add('error', message, 8000);
  }

  info(message: string): void {
    this.add('info', message, 4000);
  }

  dismiss(id: number): void {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }

  private add(type: ToastType, message: string, duration: number): void {
    const id = ++this.nextId;
    this.toasts.update(list => [...list.slice(-2), { id, type, message, duration }]);
    setTimeout(() => this.dismiss(id), duration);
  }
}
