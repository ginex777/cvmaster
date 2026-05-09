import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RevealDirective } from '../../../shared/directives/reveal.directive';

@Component({
  selector: 'lba-workflow-steps',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './workflow-steps.component.html',
  styleUrl: './workflow-steps.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkflowStepsComponent {}
