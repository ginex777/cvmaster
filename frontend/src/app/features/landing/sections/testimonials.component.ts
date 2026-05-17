import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconsModule } from '../../../shared/icons/icons.module';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

const PALETTE = ['#5B6CFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

@Component({
  selector: 'lba-testimonials',
  standalone: true,
  imports: [RevealDirective, IconsModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestimonialsComponent {
  readonly testimonials = [
    { quote: 'Drei Wochen, sieben Bewerbungen, vier Interviews. Vorher: ein Jahr, null.', name: 'Marek S.', role: 'Junior Backend · Heidelberg' },
    { quote: 'Endlich bekomme ich Anschreiben hin, die nicht klingen wie aus einem Vorlagen-Generator.', name: 'Anita K.', role: 'Werkstudentin UX · München' },
    { quote: 'Der Match-Score hat mir gezeigt, dass ich mich auf die falschen Stellen bewerbe. Game changer.', name: 'Tobias R.', role: 'Berufseinsteiger · Köln' },
  ];

  avatarColor(name: string): string {
    return PALETTE[name.length % PALETTE.length];
  }

  avatarBg(name: string): string {
    return `${this.avatarColor(name)}22`;
  }

  initials(name: string): string {
    return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  }
}
