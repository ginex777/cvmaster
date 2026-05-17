import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconsModule } from '../../shared/icons/icons.module';

@Component({
  selector: 'lba-settings',
  standalone: true,
  imports: [RouterLink, IconsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {}
