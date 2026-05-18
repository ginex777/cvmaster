import { ChangeDetectionStrategy, Component } from '@angular/core';
import { IconsModule } from '../../../shared/icons/icons.module';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

const PALETTE = ['#32459A', '#006D3B', '#7A5100', '#A62626', '#5B3BB5', '#006B7A', '#A12665'];

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
