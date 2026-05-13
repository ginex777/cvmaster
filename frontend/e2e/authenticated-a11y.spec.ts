import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const routes = ['/app', '/app/cvs', '/app/wizard', '/app/applications/a1', '/app/billing'];

interface AxeResult {
  violations: unknown[];
}

declare global {
  interface Window {
    axe?: {
      run(target: Document, options: { resultTypes: string[] }): Promise<AxeResult>;
    };
  }
}

test.beforeEach(async ({ page }) => {
  await page.route('**/api/auth/refresh', route => route.fulfill({
    json: {
      accessToken: 'test-access-token',
      user: {
        id: 'u1',
        email: 'lina@example.de',
        name: 'Lina',
        plan: 'PRO',
        emailVerified: true,
        twoFactorEnabled: true,
      },
    },
  }));

  await page.route('**/api/users/me/dashboard', route => route.fulfill({
    json: {
      cvCount: 1,
      applicationCount: 1,
      avgMatchScore: 88,
      recentApplications: [
        {
          id: 'a1',
          status: 'OPEN',
          matchScore: 88,
          createdAt: '2026-05-13T10:00:00.000Z',
          jobPosting: { parsedJson: { title: 'Frontend Developer', company: 'Acme' } },
        },
      ],
    },
  }));

  await page.route('**/api/cvs', route => route.fulfill({
    json: [
      {
        id: 'cv1',
        name: 'Lina CV',
        language: 'de',
        sourceFilename: 'lina.pdf',
        template: 'modern',
        createdAt: '2026-05-13T10:00:00.000Z',
        updatedAt: '2026-05-13T10:00:00.000Z',
      },
    ],
  }));

  await page.route('**/api/applications/a1', route => route.fulfill({
    json: {
      id: 'a1',
      status: 'OPEN',
      matchScore: 88,
      optimizedCv: { sections: [{ heading: 'Profil', lines: ['Angular, NestJS, Accessibility'] }] },
      coverLetter: { formal: 'Sehr geehrte Damen und Herren', warm: 'Hallo Acme Team', brief: 'Kurz und passend' },
      chosenVariant: 'formal',
      matchReport: { summary: 'Sehr passend', keywords: ['Angular'], missingKeywords: ['RxJS'] },
      masterCv: { template: 'modern' },
      jobPosting: { parsedJson: { title: 'Frontend Developer', company: 'Acme', keywords: ['Angular'] } },
    },
  }));
});

for (const route of routes) {
  test(`authenticated route has no axe violations: ${route}`, async ({ page }, testInfo) => {
    await page.goto(route);
    await expect(page.locator('body')).toBeVisible();

    const axeSource = await readFile(resolve('node_modules/axe-core/axe.min.js'), 'utf8');
    await page.addScriptTag({ content: axeSource });
    const result = await page.evaluate(async (): Promise<AxeResult> => {
      if (!window.axe) {
        throw new Error('axe-core script was not loaded');
      }

      return window.axe.run(document, { resultTypes: ['violations'] });
    });

    await page.screenshot({ path: testInfo.outputPath(`${route.replaceAll('/', '_') || 'root'}.png`), fullPage: true });
    expect(result.violations).toEqual([]);
  });
}
