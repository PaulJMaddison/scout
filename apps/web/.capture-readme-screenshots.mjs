import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');
const outDir = path.join(repoRoot, 'docs', 'images');
const baseUrl = 'http://127.0.0.1:4173';

const shots = [
  { route: '/demo', file: 'demo-mode-landing.png' },
  { route: '/overview', file: 'dashboard-overview.png' },
  { route: '/data-sources', file: 'data-sources.png' },
  { route: '/selectors', file: 'selector-builder.png' },
  { route: '/semantic-schema', file: 'semantic-schema-registry.png' },
  { route: '/customers/123', file: 'customer-context-viewer.png' },
  { route: '/story/scout', file: 'scout-timeline.png' },
  { route: '/bootstrap-studio', file: 'ai-bootstrap-onboarding.png' },
  { route: '/agent-playground', file: 'ai-playground.png' },
  { route: '/audit', file: 'audit-log-or-provenance.png' },
  { route: '/admin/licence', file: 'admin-licence-status.png' },
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 980 },
  deviceScaleFactor: 1,
  colorScheme: 'light',
  reducedMotion: 'reduce',
});
const page = await context.newPage();
const consoleProblems = [];
page.on('console', (message) => {
  if (['error', 'warning'].includes(message.type())) {
    consoleProblems.push(`${message.type()}: ${message.text()}`);
  }
});
page.on('pageerror', (error) => consoleProblems.push(`pageerror: ${error.message}`));

async function stabilise() {
  await page.addStyleTag({ content: `
    *, *::before, *::after {
      animation-duration: 0.001s !important;
      animation-delay: 0s !important;
      transition-duration: 0.001s !important;
      scroll-behavior: auto !important;
    }
  `}).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);
}

await page.goto(`${baseUrl}/login`, { waitUntil: 'domcontentloaded' });
await stabilise();
await page.getByRole('button', { name: /enter console/i }).click();
await page.waitForURL(/\/demo$/, { timeout: 15000 });
await stabilise();

for (const shot of shots) {
  await page.goto(`${baseUrl}${shot.route}`, { waitUntil: 'domcontentloaded' });
  await stabilise();
  const h1 = await page.locator('h1').first().textContent().catch(() => 'no h1');
  const target = path.join(outDir, shot.file);
  await page.screenshot({ path: target, fullPage: false });
  console.log(`${shot.file}\t${shot.route}\t${(h1 ?? '').trim()}`);
}

await browser.close();

const uniqueProblems = [...new Set(consoleProblems)].filter((entry) => {
  return !entry.includes('Failed to load resource: net::ERR_CONNECTION_REFUSED') &&
    !entry.includes('WebSocket connection') &&
    !entry.includes('[vite]') &&
    !entry.includes('React Router Future Flag Warning');
});
if (uniqueProblems.length) {
  console.error('\nConsole problems seen during capture:');
  for (const entry of uniqueProblems.slice(0, 20)) console.error(`- ${entry}`);
  process.exitCode = 1;
}
