import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { SeoService } from '../../core/seo/seo.service';
import { FooterComponent } from '../../shared/components/footer.component';
import { NavbarComponent } from '../../shared/components/navbar.component';
import { BeforeAfterComponent } from './sections/before-after.component';
import { CtaBandComponent } from './sections/cta-band.component';
import { FeaturesGridComponent } from './sections/features-grid.component';
import { HeroComponent } from './sections/hero.component';
import { LogoBarComponent } from './sections/logo-bar.component';
import { PricingInlineComponent } from './sections/pricing-inline.component';
import { TestimonialsComponent } from './sections/testimonials.component';
import { WorkflowStepsComponent } from './sections/workflow-steps.component';

@Component({
  selector: 'lba-landing',
  standalone: true,
  imports: [
    NavbarComponent,
    FooterComponent,
    HeroComponent,
    LogoBarComponent,
    FeaturesGridComponent,
    WorkflowStepsComponent,
    BeforeAfterComponent,
    TestimonialsComponent,
    PricingInlineComponent,
    CtaBandComponent,
  ],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingComponent {
  constructor() {
    inject(SeoService).setPage(
      'KI-optimierte Bewerbungsunterlagen',
      'Hireflow AI optimiert deinen Lebenslauf auf jede Stelle und schreibt ein passendes Anschreiben in weniger als einer Minute.',
      '/',
    );
  }
}
