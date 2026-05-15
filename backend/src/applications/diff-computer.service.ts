import { Injectable } from '@nestjs/common';
import type { ParsedCV } from '../ai/provider';

export interface DiffEntry {
  section: string;
  before: string;
  after: string;
  reason: string;
}

const MAX_DIFF_ENTRIES = 20;

@Injectable()
export class DiffComputerService {
  compute(originalCv: ParsedCV, optimizedCv: ParsedCV): DiffEntry[] {
    const originalBullets = this.indexBullets(originalCv);
    const entries: DiffEntry[] = [];

    for (const exp of optimizedCv.experience ?? []) {
      const section = `${exp.role} @ ${exp.company}`;

      for (const bullet of exp.bullets ?? []) {
        const before = originalBullets.get(bullet.id);
        if (!before || before === bullet.text) continue;

        entries.push({
          section,
          before,
          after: bullet.text,
          reason: bullet.reason ?? '',
        });

        if (entries.length >= MAX_DIFF_ENTRIES) return entries;
      }
    }

    return entries;
  }

  private indexBullets(cv: ParsedCV): Map<string, string> {
    const bullets = new Map<string, string>();

    for (const exp of cv.experience ?? []) {
      for (const bullet of exp.bullets ?? []) {
        bullets.set(bullet.id, bullet.text);
      }
    }

    return bullets;
  }
}
