import { Pipe, inject } from '@angular/core';
import type { PipeTransform } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import type { SafeHtml } from '@angular/platform-browser';

@Pipe({ name: 'highlight', standalone: true, pure: true })
export class HighlightPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(text: string, query: string): SafeHtml {
    if (!text) return this.sanitizer.bypassSecurityTrustHtml('');
    const escaped = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    if (!query.trim()) return this.sanitizer.bypassSecurityTrustHtml(escaped);
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return this.sanitizer.bypassSecurityTrustHtml(
      escaped.replace(regex, '<mark class="highlight">$1</mark>'),
    );
  }
}
