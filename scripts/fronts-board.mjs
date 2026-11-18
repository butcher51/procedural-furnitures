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
    out: { type: 'string', default: 'out/fronts-board.png' },
    only: { type: 'string' },
    cols: { type: 'string' },
    w: { type: 'string' },
    h: { type: 'string' },
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
  const out = resolve(root, args.out);
  await mkdir(dirname(out), { recursive: true });
  const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errors.push(m.text()));
  const query = new URLSearchParams(Object.entries({ only: args.only, cols: args.cols, w: args.w, h: args.h }).filter(([, v]) => v));
  await page.goto(`http://localhost:${port}/dev/fronts.html?${query}`);
  await page.waitForFunction(() => document.documentElement.dataset.ready, null, { timeout: 120_000 }).catch((error) => {
    errors.forEach((e) => console.error(e));
    throw error;
  });
  await page.screenshot({ path: out, fullPage: true });
  errors.forEach((e) => console.error(e));
  failed = errors.length > 0;
  console.log(out);
} finally {
  await browser.close();
  server.kill();
}
process.exitCode = failed ? 1 : 0;
