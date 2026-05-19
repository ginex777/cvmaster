import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from '../frontend/node_modules/@playwright/test/index.mjs';

const require = createRequire(import.meta.url);
const { PNG } = require('../frontend/node_modules/playwright-core/lib/utilsBundle');
const esbuild = require('../frontend/node_modules/esbuild');

const repoRoot = resolve(import.meta.dirname, '..');
const redesignRoot = resolve(repoRoot, 'redesign');
const outRoot = resolve(repoRoot, 'visual-audit', new Date().toISOString().replace(/[:.]/g, '-'));
const appBase = process.env.APP_URL ?? 'http://localhost';
const previewPort = Number(process.env.PREVIEW_PORT ?? 4177);
const previewBase = `http://127.0.0.1:${previewPort}`;

const screens = [
  { id: 'landing', route: '/', mock: 'landing', width: 1440, height: 900 },
  { id: 'login', route: '/login', mock: 'login', width: 1200, height: 800 },
  { id: 'dashboard', route: '/app', mock: 'dashboard', width: 1280, height: 900 },
  { id: 'pipeline', route: '/app/pipeline', mock: 'pipeline', width: 1280, height: 900 },
  { id: 'cvs', route: '/app/cvs', mock: 'cvs', width: 1280, height: 860 },
  { id: 'wizard', route: '/app/wizard', mock: 'wizard', width: 1280, height: 860 },
  { id: 'editor', route: '/app/applications/a1', mock: 'editor', width: 1440, height: 900 },
];

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.jsx': 'application/javascript; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startPreviewServer() {
  const server = createServer(async (req, res) => {
    const rawPath = decodeURIComponent((req.url ?? '/').split('?')[0] || '/');
    const requestPath = rawPath === '/' ? '/visuals/preview.html' : rawPath;
    const fontPrefix = '/fontsource/';

    if (requestPath === '/visuals/preview.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(previewHtml());
      return;
    }

    if (requestPath.startsWith(fontPrefix)) {
      const filePath = normalize(join(repoRoot, 'frontend', 'node_modules', '@fontsource', requestPath.slice(fontPrefix.length)));
      try {
        const body = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': mime[extname(filePath)] ?? 'application/octet-stream' });
        res.end(body);
      } catch {
        res.writeHead(404);
        res.end('not found');
      }
      return;
    }

    const filePath = normalize(join(redesignRoot, requestPath));

    if (!filePath.startsWith(redesignRoot)) {
      res.writeHead(403);
      res.end('forbidden');
      return;
    }

    try {
      let body = await readFile(filePath);
      if (extname(filePath) === '.jsx') {
        body = Buffer.from(esbuild.transformSync(body.toString('utf8'), {
          loader: 'jsx',
          jsxFactory: 'React.createElement',
          jsxFragment: 'React.Fragment',
          target: 'es2019',
        }).code);
      }
      res.writeHead(200, { 'Content-Type': mime[extname(filePath)] ?? 'text/plain; charset=utf-8' });
      res.end(body);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });

  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(previewPort, '127.0.0.1', () => resolveServer(server));
  });
}

function previewHtml() {
  return `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Atlas Preview</title>
<style>
@font-face { font-family: 'Geist'; font-style: normal; font-weight: 400; src: url('/fontsource/geist/files/geist-latin-400-normal.woff2') format('woff2'); }
@font-face { font-family: 'Geist'; font-style: normal; font-weight: 500; src: url('/fontsource/geist/files/geist-latin-500-normal.woff2') format('woff2'); }
@font-face { font-family: 'Geist'; font-style: normal; font-weight: 600; src: url('/fontsource/geist/files/geist-latin-600-normal.woff2') format('woff2'); }
@font-face { font-family: 'Geist'; font-style: normal; font-weight: 700; src: url('/fontsource/geist/files/geist-latin-700-normal.woff2') format('woff2'); }
@font-face { font-family: 'Geist Mono'; font-style: normal; font-weight: 400; src: url('/fontsource/geist-mono/files/geist-mono-latin-400-normal.woff2') format('woff2'); }
@font-face { font-family: 'Geist Mono'; font-style: normal; font-weight: 500; src: url('/fontsource/geist-mono/files/geist-mono-latin-500-normal.woff2') format('woff2'); }
html, body { margin: 0; padding: 0; background: #f0eee9; font-family: 'Geist', sans-serif; overflow: hidden; }
#frame { background: #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.08); }
</style>
</head>
<body>
<div id="root"></div>
<script>
const SVG_TAGS = new Set(['svg','path','circle','rect','line','polyline','polygon','g','defs','pattern','use']);
const React = {
  Fragment: Symbol('Fragment'),
  createElement(type, props, ...children) {
    return { type, props: { ...(props || {}), children } };
  },
};
function flatten(children) {
  return children.flat ? children.flat(Infinity) : [].concat(...children);
}
function cssName(name) {
  return name.replace(/[A-Z]/g, c => '-' + c.toLowerCase());
}
function cssValue(name, value) {
  if (typeof value !== 'number') return value;
  if (['opacity','zIndex','fontWeight','lineHeight','flex','flexGrow','flexShrink','order'].includes(name)) return String(value);
  return value + 'px';
}
function setProps(node, props) {
  for (const [key, value] of Object.entries(props || {})) {
    if (key === 'children' || key === 'key' || key === 'ref' || value == null || typeof value === 'function') continue;
    if (key === 'className') { node.setAttribute('class', value); continue; }
    if (key === 'htmlFor') { node.setAttribute('for', value); continue; }
    if (key === 'style' && typeof value === 'object') {
      for (const [styleKey, styleValue] of Object.entries(value)) node.style.setProperty(cssName(styleKey), cssValue(styleKey, styleValue));
      continue;
    }
    if (key === 'dangerouslySetInnerHTML' && value.__html != null) { node.innerHTML = value.__html; continue; }
    node.setAttribute(key, value === true ? '' : String(value));
  }
}
function renderElement(vnode, parent, ns = null) {
  if (vnode == null || vnode === false || vnode === true) return;
  if (Array.isArray(vnode)) { vnode.forEach(child => renderElement(child, parent, ns)); return; }
  if (typeof vnode === 'string' || typeof vnode === 'number') { parent.appendChild(document.createTextNode(String(vnode))); return; }
  if (typeof vnode.type === 'function') { renderElement(vnode.type(vnode.props || {}), parent, ns); return; }
  if (vnode.type === React.Fragment) { flatten(vnode.props.children || []).forEach(child => renderElement(child, parent, ns)); return; }
  const nextNs = ns || (vnode.type === 'svg' ? 'http://www.w3.org/2000/svg' : null);
  const node = nextNs && SVG_TAGS.has(vnode.type)
    ? document.createElementNS(nextNs, vnode.type)
    : document.createElement(vnode.type);
  setProps(node, vnode.props);
  flatten(vnode.props.children || []).forEach(child => renderElement(child, node, nextNs));
  parent.appendChild(node);
}
window.React = React;
</script>
<script src="/icons.jsx"></script>
<script src="/shared.jsx"></script>
<script src="/screens-app.jsx"></script>
<script src="/screen-editor.jsx"></script>
<script src="/screens-marketing.jsx"></script>
<script>
const SCREENS = {
  landing:   { c: window.LandingScreen,   w: 1440, h: 900 },
  login:     { c: window.LoginScreen,     w: 1200, h: 800 },
  dashboard: { c: window.DashboardScreen, w: 1280, h: 900 },
  pipeline:  { c: window.PipelineScreen,  w: 1280, h: 900 },
  cvs:       { c: window.CvsScreen,       w: 1280, h: 860 },
  wizard:    { c: window.WizardScreen,    w: 1280, h: 860 },
  editor:    { c: window.EditorScreen,    w: 1440, h: 900 },
};
const screen = new URLSearchParams(location.search).get('s') || 'dashboard';
const def = SCREENS[screen] || SCREENS.dashboard;
const root = document.getElementById('root');
root.style.cssText = 'width:100vw;height:100vh;display:flex;align-items:center;justify-content:center;background:#f0eee9';
const frame = document.createElement('div');
frame.id = 'frame';
frame.style.width = def.w + 'px';
frame.style.height = def.h + 'px';
root.appendChild(frame);
renderElement(React.createElement(def.c), frame);
</script>
</body>
</html>`;
}

async function installAppRoutes(page) {
  await page.addInitScript(() => {
    const fixedNow = new Date('2026-05-17T09:00:00+02:00').getTime();
    const NativeDate = Date;
    class FixedDate extends NativeDate {
      constructor(...args) {
        super(...(args.length ? args : [fixedNow]));
      }
      static now() {
        return fixedNow;
      }
    }
    FixedDate.UTC = NativeDate.UTC;
    FixedDate.parse = NativeDate.parse;
    FixedDate.prototype = NativeDate.prototype;
    window.Date = FixedDate;
    localStorage.setItem('consent_v1', JSON.stringify({ necessary: true, support: false, version: '2025-01' }));
  });

  await page.route('**/api/**', route => route.fulfill({ json: {} }));

  await page.route('**/api/auth/refresh', route => route.fulfill({
    json: {
      accessToken: 'visual-audit-token',
      user: {
        id: 'u1',
        email: 'lina@example.de',
        name: 'Lina Bachmann',
        plan: 'FREE',
        emailVerified: true,
        twoFactorEnabled: false,
        onboardingShown: true,
      },
    },
  }));
  await page.route('**/api/auth/login', route => route.fulfill({
    json: {
      accessToken: 'visual-audit-token',
      user: {
        id: 'u1',
        email: 'lina@example.de',
        name: 'Lina Bachmann',
        plan: 'FREE',
        emailVerified: true,
        twoFactorEnabled: false,
        onboardingShown: true,
      },
    },
  }));

  const applications = [
    app('a1', 'INTERVIEW', 88, 'Stripe', 'Frontend Developer', '2026-05-15T10:00:00.000Z', '2026-05-19T14:00:00.000Z'),
    app('a2', 'APPLIED', 76, 'Figma', 'Senior Frontend', '2026-05-14T10:00:00.000Z', '2026-05-21T08:30:00.000Z'),
    app('a3', 'DRAFT', null, 'Linear', 'Product Designer', '2026-05-17T10:00:00.000Z'),
    app('a4', 'OFFER', 92, 'Notion', 'Engineer · Web', '2026-05-10T10:00:00.000Z', '2026-05-23T12:00:00.000Z'),
    app('a5', 'APPLIED', 84, 'Vercel', 'DX Engineer', '2026-05-13T10:00:00.000Z'),
    app('a6', 'REJECTED', 64, 'Cal.com', 'Eng', '2026-05-08T10:00:00.000Z'),
  ];

  await page.route('**/api/users/me/dashboard', route => route.fulfill({
    json: {
      cvCount: 4,
      applicationCount: 5,
      avgMatchScore: 83,
      recentApplications: applications,
    },
  }));

  await page.route('**/api/applications', route => {
    if (route.request().method() === 'POST') {
      return route.fulfill({ json: { id: 'a1' } });
    }
    return route.fulfill({ json: applications });
  });

  await page.route('**/api/applications/a1', route => route.fulfill({ json: detailedApplication() }));
  await page.route('**/api/applications/a1/**', route => {
    const url = route.request().url();
    if (url.includes('/follow-up-templates')) {
      return route.fulfill({ json: [
        { type: 'reminder', label: 'Erinnerung', subject: 'Nachfrage', body: 'Sehr geehrte Damen und Herren,' },
        { type: 'status', label: 'Status', subject: 'Statusanfrage', body: 'Ich beziehe mich auf meine Bewerbung.' },
        { type: 'thanks', label: 'Danke', subject: 'Vielen Dank', body: 'Vielen Dank fuer das Gespraech.' },
      ] });
    }
    return route.fulfill({ json: detailedApplication() });
  });

  await page.route('**/api/cvs', route => route.fulfill({ json: cvs() }));
  await page.route('**/api/cvs/**', route => route.fulfill({ json: cvs()[0] }));
  await page.route('**/api/jobs/parse', route => route.fulfill({ json: { id: 'job1' } }));
  await page.route('**/api/cvs/quickstart', route => route.fulfill({ json: cvs()[0] }));
  await page.route('**/api/users/me/sessions', route => route.fulfill({ json: [] }));
  await page.route('**/api/users/me/consents', route => route.fulfill({ json: [] }));
}

function app(id, status, matchScore, company, title, createdAt, reminderAt = null) {
  return {
    id,
    status,
    matchScore,
    generationProgress: 100,
    generationError: null,
    createdAt,
    reminderAt,
    jobPosting: { parsedJson: { title, company, location: 'Remote EU', keywords: ['React', 'TypeScript', 'Accessibility'] } },
  };
}

function detailedApplication() {
  return {
    ...app('a1', 'INTERVIEW', 88, 'Stripe', 'Frontend Developer', '2026-05-15T10:00:00.000Z'),
    optimizedCv: {
      sections: [
        { id: 'profile', heading: 'Profil', bullets: [{ id: 'b1', text: 'Frontend developer focused on React, TypeScript and accessibility.', accepted: true }] },
        { id: 'experience', heading: 'Erfahrung', bullets: [{ id: 'b2', text: 'Delivered production checkout flows with Angular and NestJS.', accepted: true }] },
        { id: 'skills', heading: 'Skills', bullets: [{ id: 'b3', text: 'React, TypeScript, Accessibility, NestJS, Angular, Testing Library' }] },
      ],
    },
    coverLetter: {
      formal: 'Sehr geehrtes Stripe-Team, als Frontend-Entwicklerin mit Fokus auf barrierefreie SaaS-Oberflaechen bewerbe ich mich gern.',
      warm: 'Hallo Stripe-Team, eure Produktqualitaet begeistert mich.',
      concise: 'Kurz: React, TypeScript und Accessibility passen sehr gut zu dieser Rolle.',
    },
    chosenVariant: 'formal',
    coverLetterTone: 'formal',
    masterCv: { template: 'modern' },
    matchReport: {
      summary: 'Starkes Match mit 14 von 16 Keywords.',
      matchedKeywords: ['React', 'TypeScript', 'Accessibility', 'Tests'],
      missingKeywords: ['RxJS', 'GraphQL'],
      strengths: ['Accessibility', 'SaaS UI'],
      risks: ['RxJS fehlt'],
    },
    optimizationDiff: [],
  };
}

function cvs() {
  return [
    { id: 'cv1', name: 'Lina CV', language: 'de', sourceFilename: 'lina.pdf', template: 'modern', createdAt: '2026-05-13T10:00:00.000Z', updatedAt: '2026-05-13T10:00:00.000Z' },
    { id: 'cv2', name: 'Classic CV', language: 'de', sourceFilename: 'classic.pdf', template: 'classic', createdAt: '2026-05-12T10:00:00.000Z', updatedAt: '2026-05-12T10:00:00.000Z' },
    { id: 'cv3', name: 'Editorial CV', language: 'de', sourceFilename: 'editorial.pdf', template: 'editorial', createdAt: '2026-05-11T10:00:00.000Z', updatedAt: '2026-05-11T10:00:00.000Z' },
  ];
}

async function captureMock(page, screen) {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  const messages = [];
  page.on('console', msg => messages.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => messages.push(`pageerror: ${error.message}`));
  await page.goto(`${previewBase}/visuals/preview.html?s=${screen.mock}`, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForFunction(() => (document.querySelector('#frame')?.textContent ?? '').trim().length > 40, null, { timeout: 45000 });
  const path = join(outRoot, `${screen.id}-mock.png`);
  await page.screenshot({ path, fullPage: false, animations: 'disabled' });
  return { path, messages, metrics: await collectMetrics(page) };
}

async function captureApp(page, screen) {
  await page.setViewportSize({ width: screen.width, height: screen.height });
  await installAppRoutes(page);
  const messages = [];
  page.on('console', msg => messages.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror', error => messages.push(`pageerror: ${error.message}`));
  if (screen.route.startsWith('/app')) {
    await page.goto(`${appBase}/login`, { waitUntil: 'networkidle', timeout: 45000 });
    await page.fill('#login-email', 'lina@example.de');
    await page.fill('#login-password', 'visual-audit');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/app', { timeout: 45000 });
    if (screen.route !== '/app') {
      await page.evaluate(route => {
        window.history.pushState({}, '', route);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, screen.route);
      await page.waitForTimeout(500);
    }
  } else {
    await page.goto(`${appBase}${screen.route}`, { waitUntil: 'networkidle', timeout: 45000 });
  }
  await page.waitForSelector('body', { state: 'visible' });
  await page.waitForTimeout(700);
  const path = join(outRoot, `${screen.id}-app.png`);
  await page.screenshot({ path, fullPage: false, animations: 'disabled' });
  return { path, messages, metrics: await collectMetrics(page) };
}

async function collectMetrics(page) {
  return page.evaluate(() => {
    const visible = element => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    };
    const texts = Array.from(document.querySelectorAll('h1,h2,h3,p,a,button,span,small,label'))
      .filter(visible)
      .map(el => (el.textContent ?? '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .slice(0, 80);
    const root = getComputedStyle(document.documentElement);
    const body = getComputedStyle(document.body);
    const firstH1 = document.querySelector('h1');
    const h1 = firstH1 ? getComputedStyle(firstH1) : null;
    return {
      url: location.href,
      title: document.title,
      bodyBg: body.backgroundColor,
      bodyFont: body.fontFamily,
      h1FontSize: h1?.fontSize ?? null,
      h1Weight: h1?.fontWeight ?? null,
      tokens: {
        bg: root.getPropertyValue('--bg').trim(),
        accent: root.getPropertyValue('--accent').trim(),
        accent2: root.getPropertyValue('--accent-2').trim(),
        ink: root.getPropertyValue('--ink').trim(),
        ink2: root.getPropertyValue('--ink-2').trim(),
        ink3: root.getPropertyValue('--ink-3').trim(),
        radiusSm: root.getPropertyValue('--radius-sm').trim(),
        radiusMd: root.getPropertyValue('--radius-md').trim(),
      },
      textSample: texts,
    };
  });
}

async function compareImages(actualPath, expectedPath, diffPath) {
  const actual = PNG.sync.read(await readFile(actualPath));
  const expected = PNG.sync.read(await readFile(expectedPath));
  if (actual.width !== expected.width || actual.height !== expected.height) {
    return { sizeMismatch: true, actual: [actual.width, actual.height], expected: [expected.width, expected.height] };
  }

  const diff = new PNG({ width: actual.width, height: actual.height });
  let mismatches = 0;
  const threshold = 28;
  for (let i = 0; i < actual.data.length; i += 4) {
    const dr = Math.abs(actual.data[i] - expected.data[i]);
    const dg = Math.abs(actual.data[i + 1] - expected.data[i + 1]);
    const db = Math.abs(actual.data[i + 2] - expected.data[i + 2]);
    const da = Math.abs(actual.data[i + 3] - expected.data[i + 3]);
    const mismatch = dr + dg + db + da > threshold;
    if (mismatch) mismatches++;
    diff.data[i] = mismatch ? 255 : actual.data[i];
    diff.data[i + 1] = mismatch ? 0 : actual.data[i + 1];
    diff.data[i + 2] = mismatch ? 80 : actual.data[i + 2];
    diff.data[i + 3] = mismatch ? 220 : 70;
  }
  await writeFile(diffPath, PNG.sync.write(diff));
  const pixels = actual.width * actual.height;
  return {
    sizeMismatch: false,
    mismatches,
    pixels,
    mismatchRatio: Number((mismatches / pixels).toFixed(6)),
    matchRatio: Number((1 - mismatches / pixels).toFixed(6)),
  };
}

function summarize(screen, mock, app, diff) {
  const mockText = new Set(mock.metrics.textSample);
  const appText = new Set(app.metrics.textSample);
  const missingFromApp = [...mockText].filter(text => !appText.has(text)).slice(0, 20);
  const extraInApp = [...appText].filter(text => !mockText.has(text)).slice(0, 20);
  return {
    id: screen.id,
    route: screen.route,
    mock: screen.mock,
    viewport: [screen.width, screen.height],
    diff,
    mockMetrics: mock.metrics,
    appMetrics: app.metrics,
    missingFromApp,
    extraInApp,
    mockMessages: mock.messages,
    appMessages: app.messages,
  };
}

async function main() {
  await mkdir(outRoot, { recursive: true });
  const server = await startPreviewServer();
  const browser = await chromium.launch({ headless: true });
  const results = [];

  try {
    for (const screen of screens) {
      const mockContext = await browser.newContext({ deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const appContext = await browser.newContext({ deviceScaleFactor: 1, reducedMotion: 'reduce' });
      const mockPage = await mockContext.newPage();
      const appPage = await appContext.newPage();

      const mock = await captureMock(mockPage, screen);
      const app = await captureApp(appPage, screen);
      const diffPath = join(outRoot, `${screen.id}-diff.png`);
      const diff = await compareImages(app.path, mock.path, diffPath);
      results.push(summarize(screen, mock, app, { ...diff, diffPath }));

      await mockContext.close();
      await appContext.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  const report = {
    generatedAt: new Date().toISOString(),
    appBase,
    previewBase,
    outRoot,
    screens: results,
  };
  await writeFile(join(outRoot, 'report.json'), JSON.stringify(report, null, 2));

  const markdown = [
    '# Atlas Visual Audit',
    '',
    `Generated: ${report.generatedAt}`,
    `App: ${appBase}`,
    `Output: ${outRoot}`,
    '',
    '| Screen | Route | Pixel match | Mismatch | Notes |',
    '|---|---:|---:|---:|---|',
    ...results.map(result => {
      const diff = result.diff.sizeMismatch
        ? `size mismatch ${result.diff.actual?.join('x')} vs ${result.diff.expected?.join('x')}`
        : `${(result.diff.matchRatio * 100).toFixed(2)}%`;
      const mismatch = result.diff.sizeMismatch ? 'n/a' : `${(result.diff.mismatchRatio * 100).toFixed(2)}%`;
      const notes = [
        result.missingFromApp.length ? `${result.missingFromApp.length} mock text snippets missing` : '',
        result.appMessages.length ? `${result.appMessages.length} app console messages` : '',
        result.mockMessages.length ? `${result.mockMessages.length} mock console messages` : '',
      ].filter(Boolean).join('; ') || 'none';
      return `| ${result.id} | ${result.route} | ${diff} | ${mismatch} | ${notes} |`;
    }),
  ].join('\n');
  await writeFile(join(outRoot, 'report.md'), markdown);
  console.log(markdown);
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
