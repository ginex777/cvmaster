import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';
import { IconsModule } from '../../../shared/icons/icons.module';

@Component({
  selector: 'lba-workflow-steps',
  standalone: true,
  imports: [RevealDirective, IconsModule],
  templateUrl: './workflow-steps.component.html',
  styleUrl: './workflow-steps.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowStepsComponent {}
