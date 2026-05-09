import type { OnInit } from '@angular/core';
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { SlicePipe } from '@angular/common';

export interface MasterCv {
  id: string;
  name: string;
  language: string;
  sourceFilename: string;
  updatedAt: string;
}

@Component({
  selector: 'lba-master-cvs',
  standalone: true,
  imports: [SlicePipe],
  templateUrl: './master-cvs.component.html',
  styleUrl: './master-cvs.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MasterCvsComponent implements OnInit {
  private http = inject(HttpClient);

  cvs     = signal<MasterCv[]>([]);
  loading = signal(true);

  async ngOnInit() {
    try {
      const data = await firstValueFrom(this.http.get<MasterCv[]>('/api/cvs'));
      this.cvs.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  async upload(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('file', file);
    form.append('name', file.name.replace(/\.[^.]+$/, ''));
    const cv = await firstValueFrom(this.http.post<MasterCv>('/api/cvs', form));
    this.cvs.update(list => [cv, ...list]);
  }
}
