import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { createServer } from 'node:net';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const { values: args } = parseArgs({
  options: {
    out: { type: 'string', default: 'out/pattern-board.png' },
    perf: { type: 'string' },
    parts: { type: 'string' },
    gpu: { type: 'string', default: 'auto' },
  },
});

const freePort = () =>
  new Promise((done, fail) => {
    const probe = createServer();
    probe.on('error', fail);
    probe.listen(0, () => {
      const { port } = probe.address();
      probe.close(() => done(port));
    });
  });

const port = await freePort();
const server = spawn(process.execPath, [join(root, 'server.js')], { env: { ...process.env, PORT: String(port) }, stdio: ['ignore', 'pipe', 'inherit'] });
await new Promise((done) => server.stdout.once('data', done));
const gpuArgs = args.gpu === 'software' ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=default'];
const browser = await chromium.launch({ args: gpuArgs });
let failed = false;

try {
  if (args.perf) {
    const rows = [];
    for (const type of args.perf.split(',')) {
      for (const plain of [true, false]) {
        const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
        const errors = [];
        page.on('pageerror', (e) => errors.push(e.message));
        page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
        await page.goto(`http://localhost:${port}/dev/patterns.html?perf=${type}${plain ? '&plain' : ''}`);
        await page.waitForFunction(() => document.documentElement.dataset.result, null, { timeout: 180_000 });
        const result = JSON.parse(await page.evaluate(() => document.documentElement.dataset.result));
        rows.push({ ...result, errors: errors.length, ok: result.avg < 17 && !errors.length });
        errors.forEach((e) => console.error(e));
        await page.close();
      }
    }
    console.table(rows);
    failed = !rows.every((r) => r.ok);
  } else {
    const out = resolve(root, args.out);
    await mkdir(dirname(out), { recursive: true });
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(m.text()));
    await page.goto(`http://localhost:${port}/dev/patterns.html`);
    await page.waitForFunction(() => document.documentElement.dataset.ready, null, { timeout: 120_000 });
    await page.screenshot({ path: out, fullPage: true });
    if (args.parts) {
      const { width, height } = await page.evaluate(() => ({ width: document.body.scrollWidth, height: document.body.scrollHeight }));
      const step = Math.ceil(height / Number(args.parts));
      for (let i = 0; i < Number(args.parts); i++) {
        const path = out.replace(/\.png$/, `-${i + 1}.png`);
        await page.screenshot({ path, fullPage: true, clip: { x: 0, y: i * step, width, height: Math.min(step, height - i * step) } });
        console.log(path);
      }
    }
    errors.forEach((e) => console.error(e));
    failed = errors.length > 0;
    console.log(out);
  }
} finally {
  await browser.close();
  server.kill();
}
process.exitCode = failed ? 1 : 0;
