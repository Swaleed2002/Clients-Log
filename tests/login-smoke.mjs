import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const root = 'http://127.0.0.1:4173/';
const proc = spawn(process.execPath, ['node_modules/vite/bin/vite.js', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
  stdio: 'pipe',
  env: { ...process.env, NODE_ENV: 'production' }
});

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitForServer() {
  for (let i = 0; i < 60; i++) {
    if (proc.exitCode !== null) throw new Error('Vite preview exited before listening.');
    try {
      const response = await fetch(root);
      if (response.ok) return;
    } catch {}
    await sleep(250);
  }
  throw new Error('Vite preview did not become ready.');
}

let browser;
try {
  await waitForServer();
  browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  await mkdir('test-artifacts', { recursive: true });
  for (const [label, viewport] of [
    ['desktop', { width: 1440, height: 900 }],
    ['mobile', { width: 375, height: 812 }]
  ]) {
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
    await page.goto(root, { waitUntil: 'domcontentloaded' });
    await page.getByRole('heading', { name: /Engineer Portal/i }).waitFor({ timeout: 20000 });
    assert.equal(await page.getByLabel('User ID').count(), 1);
    assert.equal(await page.getByLabel('Password').count(), 1);
    assert.equal(await page.getByRole('button', { name: 'SECURE LOGIN' }).count(), 1);
    assert.equal(await page.getByLabel('User ID').isVisible(), true);
    const sizes = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth
    }));
    assert.ok(sizes.content <= sizes.viewport + 3,
      `${label} login overflows horizontally: ${sizes.content} > ${sizes.viewport}`);
    await page.screenshot({ path: `test-artifacts/login-${label}.png`, fullPage: true });
    console.log(`PASS ${label}: login loaded, labeled inputs, no horizontal overflow`);
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  proc.kill('SIGTERM');
}
