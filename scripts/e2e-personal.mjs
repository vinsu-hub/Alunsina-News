// Run with `node scripts/e2e-personal.mjs` against the existing dev server.
// PLAYWRIGHT_MODULE can point to a separately installed playwright index.mjs.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.BASE_URL || 'http://localhost:3100';
await mkdir('.playwright-mcp', { recursive: true });
const browser = await chromium.launch();
const errors = [];

async function visible(locator) {
  await locator.waitFor({ state: 'visible' });
}
async function shot(page, name, width) {
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${name}: horizontal overflow at ${width}`);
  await page.screenshot({ path: `.playwright-mcp/codex-personal-${name}-${width}.png`, fullPage: true });
}
async function choose(page, query) {
  const input = page.getByRole('combobox', { name: 'City or municipality' });
  await input.fill(query);
  await visible(page.getByRole('option').filter({ hasText: query }).first());
  await input.press('ArrowDown');
  await input.press('ArrowUp');
  await input.press('Escape');
  assert.equal(await input.getAttribute('aria-expanded'), 'false');
  await input.press('ArrowDown');
  await input.press('Enter');
  await visible(page.getByRole('heading', { level: 1 }).filter({ hasText: query }));
  await visible(page.getByRole('heading', { name: /Local sources/ }));
}

try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, geolocation: { latitude: 14.07, longitude: 121.33 }, permissions: ['geolocation'] });
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await page.goto(`${base}/my-area`);
    await visible(page.getByRole('heading', { name: 'Set your area to see local coverage' }));
    await shot(page, 'my-area-empty', width);
    await choose(page, 'San Pablo');
    await shot(page, 'my-area-set', width);
    await page.getByRole('button', { name: 'Change location' }).click();
    await choose(page, 'Cebu City');
    await page.getByRole('button', { name: 'Change location' }).click();
    await page.getByRole('button', { name: 'Use my current location' }).click();
    await visible(page.getByRole('heading', { level: 1 }).filter({ hasText: 'San Pablo' }));
    const area = await page.evaluate(() => JSON.parse(localStorage.getItem('alunsina.area')));
    assert.equal(area[0].name, 'San Pablo');
    assert.ok(!JSON.stringify(area).includes('latitude') && !JSON.stringify(area).includes('121.33'), 'coordinates must not be persisted');

    await page.goto(`${base}/story/metro-manila-lgus-prepare-flooding`);
    await page.getByRole('button', { name: /^Save(?: story)?$/ }).first().click();
    await page.goto(`${base}/saved`);
    await visible(page.getByText('1 saved story', { exact: true }));
    await shot(page, 'saved', width);
    await page.goto(`${base}/settings`);
    await visible(page.getByRole('checkbox', { name: 'Filipino', exact: true }));
    assert.equal(await page.getByRole('checkbox').count(), 9);
    await page.getByRole('checkbox', { name: 'Filipino', exact: true }).check();
    await page.getByRole('group', { name: 'Topics', exact: true }).getByRole('button', { name: 'Environment', exact: true }).click();
    await page.getByRole('group', { name: 'Regions', exact: true }).getByRole('button', { name: 'Region VII', exact: true }).click();
    await page.getByRole('group', { name: 'Source types', exact: true }).getByRole('button', { name: 'Community', exact: true }).click();
    await shot(page, 'settings', width);
    await page.getByRole('link', { name: 'View feed' }).click();
    await visible(page.getByRole('link', { name: 'Edit', exact: true }));
    await visible(page.locator('main').getByRole('link', { name: /Metro Manila LGUs/i }).first());
    await shot(page, 'following', width);
    await page.goto(`${base}/settings`);
    await page.getByRole('button', { name: 'Clear all preferences on this device' }).click();
    await visible(page.getByRole('alertdialog'));
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    assert.equal(await page.getByRole('checkbox', { name: 'Filipino', exact: true }).isChecked(), true);
    await page.getByRole('button', { name: 'Clear all preferences on this device' }).click();
    await page.getByRole('button', { name: 'Yes, clear all', exact: true }).click();
    await visible(page.getByText('All preferences on this device were cleared.', { exact: true }));
    assert.equal(await page.evaluate(() => Object.keys(localStorage).filter((k) => k.startsWith('alunsina.')).length), 0);
    await page.goto(`${base}/saved`);
    await visible(page.getByRole('heading', { name: 'Nothing saved yet' }));
    await page.goto(`${base}/saved?tab=following`);
    await visible(page.getByRole('heading', { name: "You're not following anything yet" }));
    await context.close();
  }

  // Deterministic denial and unavailable-storage tests; browser permissions vary by host.
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(_success, failure) { failure({ code: 1 }); } } });
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('Storage blocked', 'SecurityError'); } });
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(`${base}/my-area`);
  await page.getByRole('button', { name: 'Use my current location' }).click();
  await visible(page.getByText('Location permission was denied. Search for your city or municipality instead.', { exact: true }));
  await choose(page, 'San Pablo');
  await page.getByRole('navigation', { name: 'Primary', exact: true }).getByRole('link', { name: 'Profile', exact: true }).click();
  await visible(page.locator('#my-area').getByText('San Pablo', { exact: false }));
  await page.getByRole('button', { name: 'Clear all preferences on this device' }).click();
  await page.getByRole('button', { name: 'Yes, clear all', exact: true }).click();
  await visible(page.getByText('No area set.', { exact: true }));
  await context.close();
  assert.deepEqual(errors, [], 'browser console/page errors');
  console.log('Personal flows passed at 1440 and 390; denied geolocation and unavailable storage passed; 10 screenshots saved.');
} finally {
  await browser.close();
}
