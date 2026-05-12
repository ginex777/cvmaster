import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = (process.env.A11Y_URL ?? 'http://localhost:4200').replace(/\/$/, '');
const routes = (process.env.A11Y_ROUTES ?? '/,/preise,/try')
  .split(',')
  .map(route => route.trim())
  .filter(Boolean);

const axeSource = await readFile(resolve('node_modules/axe-core/axe.min.js'), 'utf8');
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const failures = [];

for (const route of routes) {
  const url = `${baseUrl}${route.startsWith('/') ? route : `/${route}`}`;
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.addScriptTag({ content: axeSource });

  const result = await page.evaluate(async () => {
    return window.axe.run(document, {
      resultTypes: ['violations'],
    });
  });

  if (result.violations.length > 0) {
    failures.push({ route, violations: result.violations });
  }
}

await browser.close();

if (failures.length > 0) {
  for (const failure of failures) {
    console.error(`Accessibility violations on ${failure.route}:`);
    for (const violation of failure.violations) {
      console.error(`- ${violation.id}: ${violation.help}`);
      for (const node of violation.nodes.slice(0, 3)) {
        console.error(`  ${node.target.join(', ')}`);
      }
    }
  }

  process.exitCode = 1;
} else {
  console.log(`Accessibility smoke passed for ${routes.join(', ')} at ${baseUrl}`);
}
