import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'highlight', standalone: true, pure: true })
export class HighlightPipe implements PipeTransform {
  transform(text: string, query: string): string {
    if (!query.trim()) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    return text.replace(regex, '<mark class="highlight">$1</mark>');
  }
}
