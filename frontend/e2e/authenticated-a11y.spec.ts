import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const publicRoutes = ['/', '/preise', '/login', '/register', '/faq'];

const appRoutes = [
  '/app',
  '/app/applications',
  '/app/pipeline',
  '/app/cvs',
  '/app/wizard',
  '/app/applications/a1',
  '/app/settings',
  '/app/settings/billing',
  '/app/settings/security',
  '/app/settings/data',
  '/app/linkedin',
];

const allRoutes = [...publicRoutes, ...appRoutes];

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
  // Auth
  await page.route('**/api/auth/refresh', route => route.fulfill({
    json: {
      accessToken: 'test-access-token',
      user: {
        id: 'u1',
        email: 'lina@example.de',
        name: 'Lina',
        plan: 'PRO',
        emailVerified: true,
        twoFactorEnabled: false,
        onboardingShown: true,
      },
    },
  }));

  // Dashboard + Applications list
  await page.route('**/api/users/me/dashboard', route => route.fulfill({
    json: {
      cvCount: 1,
      applicationCount: 1,
      avgMatchScore: 88,
      recentApplications: [
        {
          id: 'a1',
          status: 'APPLIED',
          matchScore: 88,
          createdAt: '2026-05-13T10:00:00.000Z',
          jobPosting: { parsedJson: { title: 'Frontend Developer', company: 'Acme' } },
        },
      ],
    },
  }));

  // Applications list
  await page.route('**/api/applications', route => route.fulfill({
    json: [
      {
        id: 'a1',
        status: 'APPLIED',
        matchScore: 88,
        generationProgress: 100,
        createdAt: '2026-05-13T10:00:00.000Z',
        jobPosting: { parsedJson: { title: 'Frontend Developer', company: 'Acme' } },
      },
    ],
  }));

  // Single application
  await page.route('**/api/applications/a1', route => route.fulfill({
    json: {
      id: 'a1',
      status: 'APPLIED',
      matchScore: 88,
      generationProgress: 100,
      optimizedCv: { sections: [{ heading: 'Profil', lines: ['Angular, NestJS, Accessibility'] }] },
      coverLetter: { formal: 'Sehr geehrte Damen und Herren', warm: 'Hallo Acme Team', brief: 'Kurz und passend' },
      chosenVariant: 'formal',
      matchReport: { summary: 'Sehr passend', keywords: ['Angular'], missingKeywords: ['RxJS'] },
      masterCv: { template: 'modern' },
      jobPosting: { parsedJson: { title: 'Frontend Developer', company: 'Acme', keywords: ['Angular'] } },
    },
  }));

  // CVs
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

  // Settings: security sessions
  await page.route('**/api/users/me/sessions', route => route.fulfill({ json: [] }));

  // Settings: data consents
  await page.route('**/api/users/me/consents', route => route.fulfill({ json: [] }));
});

for (const route of allRoutes) {
  test(`route has no axe violations: ${route}`, async ({ page }, testInfo) => {
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
